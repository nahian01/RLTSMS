import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { Subscription } from '../../src/types';

export const subscriptionsRouter = Router();

// GET /api/subscriptions - List subscriptions
subscriptionsRouter.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  const state = dbStore.getState();
  let list = state.subscriptions;

  if (status && status !== 'all') {
    list = list.filter((s) => s.status === status);
  }

  return res.json(list);
});

// POST /api/subscriptions/:id/renew - Record renewal payment and advance cycle
subscriptionsRouter.post('/:id/renew', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const subId = req.params.id;
  const { amount, paymentReference, newRenewalDate, cardId } = req.body;

  if (!amount || !paymentReference || !newRenewalDate) {
    return res.status(400).json({ error: 'amount, paymentReference, and newRenewalDate are required.' });
  }

  const state = dbStore.getState();
  const sub = state.subscriptions.find((s) => s.id === subId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found.' });
  }

  const prevRenewal = sub.nextRenewalDate;

  dbStore.mutate((s) => {
    const target = s.subscriptions.find((item) => item.id === subId)!;
    target.lastPaymentDate = new Date().toISOString().split('T')[0];
    target.nextRenewalDate = newRenewalDate;
    target.currentAmount = Number(amount);
    if (cardId) target.paymentCardId = cardId;

    // Append new payment log (historical immutability)
    s.purchases.unshift({
      id: `pur-ren-${Date.now()}`,
      requisitionId: 'N/A (Recurring Renewal)',
      requisitionNumber: 'RENEWAL',
      serviceId: target.serviceId,
      serviceName: target.serviceName,
      accountEmail: target.accountEmail || 'billing@riseuplabs.com',
      actualPlan: target.planName,
      actualAmount: Number(amount),
      currency: target.currency,
      billingCycle: target.billingCycle,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseSource: 'Direct',
      providerName: target.serviceName,
      paymentCardId: target.paymentCardId,
      paymentReference: paymentReference.trim(),
      nextRenewalDate: newRenewalDate,
      requestedAmount: Number(amount),
      differenceAmount: 0,
      purchaserId: currentUserId,
      purchaserName: currentUser ? currentUser.name : 'Finance Officer',
      createdAt: new Date().toISOString(),
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Subscription Renewed',
      entity: 'Subscriptions',
      entityId: subId,
      details: `Renewed subscription for ${target.serviceName} ($${amount} ${target.currency}). Extended from ${prevRenewal} to ${newRenewalDate}.`,
    });
  });

  return res.json({ success: true, message: `Subscription renewed until ${newRenewalDate}.` });
});
