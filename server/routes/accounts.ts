import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { ServiceAccount } from '../../src/types';

export const accountsRouter = Router();

// GET /api/accounts - List individual accounts
accountsRouter.get('/', (req: Request, res: Response) => {
  const { serviceId, status, search } = req.query;
  const state = dbStore.getState();
  let list = state.accounts;

  if (serviceId && serviceId !== 'all') {
    list = list.filter((a) => a.serviceId === serviceId);
  }
  if (status && status !== 'all') {
    list = list.filter((a) => a.accountStatus === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (a) =>
        a.accountEmail.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        a.planName.toLowerCase().includes(q) ||
        (a.assignedUserName && a.assignedUserName.toLowerCase().includes(q))
    );
  }

  return res.json(list);
});

// POST /api/accounts - Register new individual account under a master service
accountsRouter.post('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const {
    serviceId,
    serviceName,
    accountEmail,
    planName,
    purchaseAmount = 0,
    currency = 'USD',
    billingCycle = 'Monthly',
    purchaseSource = 'Direct',
    vendorId,
    vendorName,
    paymentCardId,
    assignedUserId,
    assignedUserName,
  } = req.body;

  if (!serviceId || !accountEmail || !planName) {
    return res.status(400).json({ error: 'serviceId, accountEmail, and planName are required.' });
  }

  const service = state.services.find((s) => s.id === serviceId);

  const newAccount: ServiceAccount = {
    id: `acc-${Date.now()}`,
    serviceId,
    serviceName: serviceName || (service ? service.name : 'Master Service'),
    accountEmail: accountEmail.trim(),
    planName: planName.trim(),
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseAmount: Number(purchaseAmount),
    currency,
    billingCycle,
    purchaseSource,
    vendorId,
    vendorName,
    paymentCardId,
    accountStatus: 'Active',
    paymentStatus: 'Paid',
    assignedUserId,
    assignedUserName,
    sharedUserIds: assignedUserId ? [assignedUserId] : [],
    sharedUserNames: assignedUserName ? [assignedUserName] : [],
  };

  dbStore.mutate((s) => {
    s.accounts.unshift(newAccount);

    // Update parent service metrics
    const svc = s.services.find((serv) => serv.id === serviceId);
    if (svc) {
      svc.accountsCount = (svc.accountsCount || 0) + 1;
      if (billingCycle === 'Monthly') {
        svc.totalMonthlySpend = (svc.totalMonthlySpend || 0) + Number(purchaseAmount);
      }
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Register Service Account',
      entity: 'Accounts & Licenses',
      entityId: newAccount.id,
      details: `Registered account ${newAccount.accountEmail} under ${newAccount.serviceName}.`,
    });
  });

  return res.status(201).json(newAccount);
});

// PATCH /api/accounts/:id/status - Update account status independently
accountsRouter.patch('/:id/status', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { status } = req.body;
  const accId = req.params.id;

  const validStatuses = ['Available', 'Assigned', 'Partially Assigned', 'Active', 'Suspended', 'Expired', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid account status provided.' });
  }

  const state = dbStore.getState();
  const acc = state.accounts.find((a) => a.id === accId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!acc) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const oldStatus = acc.accountStatus;

  dbStore.mutate((s) => {
    const target = s.accounts.find((a) => a.id === accId)!;
    target.accountStatus = status;

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Update Account Status',
      entity: 'Accounts & Licenses',
      entityId: accId,
      details: `Changed status of account ${acc.accountEmail} from ${oldStatus} to ${status}.`,
    });
  });

  return res.json({ success: true, message: `Account status updated to ${status}.` });
});
