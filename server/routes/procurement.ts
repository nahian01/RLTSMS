import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { PurchaseRecord, Subscription, ServiceAccount, Vendor } from '../../src/types';

export const procurementRouter = Router();

// GET /api/procurement/purchases - List completed purchases
procurementRouter.get('/purchases', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.purchases);
});

// POST /api/procurement/purchases - Execute purchase and record financial transaction
procurementRouter.post('/purchases', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const {
    requisitionId,
    actualPlan,
    actualAmount,
    currency = 'USD',
    billingCycle = 'Monthly',
    purchaseDate,
    purchaseSource = 'Direct',
    providerName,
    providerWebsite,
    vendorId,
    paymentCardId,
    paymentReference,
    invoiceFileName,
    nextRenewalDate,
    accountEmail,
  } = req.body;

  if (!requisitionId || !actualPlan || actualAmount === undefined || !paymentReference) {
    return res.status(400).json({ error: 'Missing required purchase transaction parameters.' });
  }

  const requisition = state.requisitions.find((r) => r.id === requisitionId);
  if (!requisition) {
    return res.status(404).json({ error: 'Originating requisition not found.' });
  }

  const requestedAmount = requisition.estimatedAmount;
  const numActualAmount = Number(actualAmount);
  // Calculate variance: Actual - Requested
  const differenceAmount = numActualAmount - requestedAmount;

  const vendor = state.vendors.find((v) => v.id === vendorId);
  const card = state.cards.find((c) => c.id === paymentCardId);

  const newPurchase: PurchaseRecord = {
    id: `pur-${Date.now()}`,
    requisitionId,
    requisitionNumber: requisition.requisitionNumber,
    serviceId: requisition.serviceId || `srv-${Date.now()}`,
    serviceName: requisition.serviceName,
    accountEmail: accountEmail || `${requisition.serviceName.toLowerCase().replace(/\s+/g, '')}@riseuplabs.com`,
    actualPlan: actualPlan.trim(),
    actualAmount: numActualAmount,
    currency,
    billingCycle,
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    purchaseSource,
    providerName: providerName || requisition.serviceName,
    providerWebsite,
    vendorId,
    vendorName: vendor ? vendor.name : undefined,
    paymentCardId,
    paymentCardMaskedLabel: card ? `${card.cardName} (•••• ${card.lastFour})` : undefined,
    paymentReference: paymentReference.trim(),
    invoiceFileName,
    nextRenewalDate,
    requestedAmount,
    differenceAmount,
    purchaserId: currentUserId,
    purchaserName: currentUser ? currentUser.name : 'Procurement Officer',
    createdAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.purchases.unshift(newPurchase);

    // Update requisition to Purchased
    const reqTarget = s.requisitions.find((r) => r.id === requisitionId);
    if (reqTarget) {
      reqTarget.status = 'Purchased';
      reqTarget.actualPurchaseId = newPurchase.id;
      reqTarget.updatedAt = new Date().toISOString();
    }

    // Register child account under service
    const newAccount: ServiceAccount = {
      id: `acc-${Date.now()}`,
      serviceId: newPurchase.serviceId,
      serviceName: newPurchase.serviceName,
      accountEmail: newPurchase.accountEmail,
      planName: newPurchase.actualPlan,
      purchaseDate: newPurchase.purchaseDate,
      purchaseAmount: newPurchase.actualAmount,
      currency: newPurchase.currency,
      billingCycle: newPurchase.billingCycle,
      nextRenewalDate: newPurchase.nextRenewalDate,
      purchaseSource: newPurchase.purchaseSource,
      vendorId: newPurchase.vendorId,
      vendorName: newPurchase.vendorName,
      paymentCardId: newPurchase.paymentCardId,
      accountStatus: 'Active',
      paymentStatus: 'Paid',
      linkedPurchaseId: newPurchase.id,
      assignedUserId: requisition.requesterId,
      assignedUserName: requisition.requesterName,
      sharedUserIds: [requisition.requesterId],
      sharedUserNames: [requisition.requesterName],
    };
    s.accounts.unshift(newAccount);

    // If recurring, register subscription
    if (billingCycle !== 'One-time') {
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        serviceId: newPurchase.serviceId,
        serviceName: newPurchase.serviceName,
        accountId: newAccount.id,
        accountEmail: newAccount.accountEmail,
        planName: newPurchase.actualPlan,
        billingCycle: newPurchase.billingCycle,
        purchaseDate: newPurchase.purchaseDate,
        startDate: newPurchase.purchaseDate,
        currentAmount: newPurchase.actualAmount,
        currency: newPurchase.currency,
        nextRenewalDate: newPurchase.nextRenewalDate,
        expectedRenewalAmount: newPurchase.actualAmount,
        autoRenewal: true,
        status: 'Active',
        lastPaymentDate: newPurchase.purchaseDate,
        paymentCardId: newPurchase.paymentCardId,
      };
      s.subscriptions.unshift(newSub);
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Procurement Officer',
      action: 'Purchase Completed',
      entity: 'Procurement',
      entityId: newPurchase.id,
      details: `Completed purchase for ${newPurchase.serviceName} ($${newPurchase.actualAmount} ${newPurchase.currency}). Variance: ${differenceAmount >= 0 ? '+' : ''}$${differenceAmount}.`,
    });
  });

  return res.status(201).json(newPurchase);
});

// GET /api/procurement/vendors
procurementRouter.get('/vendors', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.vendors);
});

// POST /api/procurement/vendors
procurementRouter.post('/vendors', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, contactPerson, email, phone, website, address, notes, status = 'Active' } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Vendor name is required.' });
  }

  const newVendor: Vendor = {
    id: `ven-${Date.now()}`,
    name: name.trim(),
    contactPerson: contactPerson || 'Sales Lead',
    email: email || '',
    phone: phone || '',
    website: website || '',
    address: address || '',
    notes: notes || '',
    status,
    totalPurchaseAmount: 0,
    activeServicesCount: 0,
    createdAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.vendors.push(newVendor);
  });

  return res.status(201).json(newVendor);
});
