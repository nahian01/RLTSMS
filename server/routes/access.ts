import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { AccountAccessAssignment, AccessRequest } from '../../src/types';

export const accessRouter = Router();

// GET /api/access/assignments - List assignments with filtering
accessRouter.get('/assignments', (req: Request, res: Response) => {
  const { status, recipientType, serviceId } = req.query;
  const state = dbStore.getState();

  // Run automatic expiration check on access assignments
  const today = new Date().toISOString().split('T')[0];
  let hasExpiredUpdates = false;

  state.accessAssignments.forEach((asgn) => {
    if (asgn.status === 'Active' && asgn.expirationDate < today) {
      asgn.status = 'Expired';
      hasExpiredUpdates = true;
    }
  });

  if (hasExpiredUpdates) {
    dbStore.mutate(() => {}); // Persist status update
  }

  let list = state.accessAssignments;
  if (status && status !== 'all') {
    list = list.filter((a) => a.status === status);
  }
  if (recipientType && recipientType !== 'all') {
    list = list.filter((a) => a.recipientType === recipientType);
  }
  if (serviceId && serviceId !== 'all') {
    list = list.filter((a) => a.serviceId === serviceId);
  }

  return res.json(list);
});

// POST /api/access/assignments - Create access assignment (Zero Credential Disclosure)
accessRouter.post('/assignments', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const {
    serviceId,
    accountId,
    recipientType,
    recipientId,
    startDate,
    expirationDate,
    permissionLevel = 'user',
    provisioningStatus = 'Provisioned',
    notes,
  } = req.body;

  if (!serviceId || !accountId || !recipientType || !recipientId || !startDate || !expirationDate) {
    return res.status(400).json({ error: 'Missing required assignment fields.' });
  }

  const service = state.services.find((s) => s.id === serviceId);
  const account = state.accounts.find((a) => a.id === accountId);

  if (!service || !account) {
    return res.status(404).json({ error: 'Service or Account not found.' });
  }

  // Prevent duplicate active assignment for same account and recipient
  const duplicate = state.accessAssignments.find(
    (a) =>
      a.accountId === accountId &&
      a.recipientType === recipientType &&
      a.recipientId === recipientId &&
      a.status === 'Active'
  );

  if (duplicate) {
    return res.status(409).json({
      error: 'An active access assignment already exists for this recipient on this account.',
    });
  }

  let recipientName = 'Recipient';
  let recipientEmail: string | undefined = undefined;

  if (recipientType === 'employee') {
    const emp = state.users.find((u) => u.id === recipientId);
    if (emp) {
      recipientName = emp.name;
      recipientEmail = emp.email;
    }
  } else if (recipientType === 'team') {
    const team = state.teams.find((t) => t.id === recipientId);
    if (team) recipientName = team.name;
  } else if (recipientType === 'department') {
    const dept = state.departments.find((d) => d.id === recipientId);
    if (dept) recipientName = dept.name;
  }

  const newAssignment: AccountAccessAssignment = {
    id: `asgn-${Date.now()}`,
    serviceId,
    serviceName: service.name,
    accountId,
    accountEmail: account.accountEmail,
    recipientType,
    recipientId,
    recipientName,
    recipientEmail,
    grantedById: currentUserId,
    grantedByName: currentUser ? currentUser.name : 'System Administrator',
    startDate,
    expirationDate,
    permissionLevel,
    status: 'Active',
    provisioningStatus,
    notes: notes ? notes.trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.accessAssignments.unshift(newAssignment);

    // Update account shared users if recipient is employee
    if (recipientType === 'employee') {
      const acc = s.accounts.find((a) => a.id === accountId);
      if (acc) {
        if (!acc.sharedUserIds) acc.sharedUserIds = [];
        if (!acc.sharedUserNames) acc.sharedUserNames = [];
        if (!acc.sharedUserIds.includes(recipientId)) {
          acc.sharedUserIds.push(recipientId);
          acc.sharedUserNames.push(recipientName);
        }
      }
    }

    // Dispatch in-app notification without credentials
    if (recipientEmail && recipientType === 'employee') {
      s.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId,
        title: `Access Granted: ${service.name}`,
        message: `You have been authorized access to ${service.name} (${permissionLevel} level) until ${expirationDate}.`,
        type: 'access',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkAction: { view: 'access' },
      });

      // Log email delivery with validated zero-credential template
      s.emailLogs.unshift({
        id: `elog-${Date.now()}`,
        templateKey: 'access_notification',
        templateName: 'Tool & Service Access Status Notice',
        recipientEmail,
        recipientName,
        subject: `RLTSMS Access Granted: ${service.name}`,
        status: 'Sent',
        attemptCount: 1,
        providerMessageId: `msg_${Date.now()}`,
        dispatchedAt: new Date().toISOString(),
      });
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Grant Account Access',
      entity: 'Access Management',
      entityId: newAssignment.id,
      details: `Granted ${permissionLevel} access on ${service.name} (Account ${account.accountEmail}) to ${recipientType} ${recipientName} until ${expirationDate}. No credentials shared.`,
    });
  });

  return res.status(201).json(newAssignment);
});

// POST /api/access/assignments/:id/extend - Extend access period
accessRouter.post('/assignments/:id/extend', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { newExpirationDate } = req.body;
  const asgnId = req.params.id;

  if (!newExpirationDate) {
    return res.status(400).json({ error: 'newExpirationDate is required.' });
  }

  const state = dbStore.getState();
  const asgn = state.accessAssignments.find((a) => a.id === asgnId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!asgn) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const prevExpiry = asgn.expirationDate;

  dbStore.mutate((s) => {
    const target = s.accessAssignments.find((a) => a.id === asgnId)!;
    target.expirationDate = newExpirationDate;
    target.status = 'Active';
    target.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Extend Account Access',
      entity: 'Access Management',
      entityId: asgnId,
      details: `Extended access on ${asgn.serviceName} for ${asgn.recipientName} from ${prevExpiry} to ${newExpirationDate}.`,
    });
  });

  return res.json({ success: true, message: `Access extended to ${newExpirationDate}.` });
});

// POST /api/access/assignments/:id/revoke - Revoke access immediately
accessRouter.post('/assignments/:id/revoke', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { reason = 'Revoked by administrator' } = req.body;
  const asgnId = req.params.id;

  const state = dbStore.getState();
  const asgn = state.accessAssignments.find((a) => a.id === asgnId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!asgn) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  dbStore.mutate((s) => {
    const target = s.accessAssignments.find((a) => a.id === asgnId)!;
    target.status = 'Revoked';
    target.notes = `${target.notes ? target.notes + ' | ' : ''}Revoked: ${reason}`;
    target.updatedAt = new Date().toISOString();

    // Remove from account sharedUserIds
    const acc = s.accounts.find((a) => a.id === target.accountId);
    if (acc && acc.sharedUserIds) {
      acc.sharedUserIds = acc.sharedUserIds.filter((id) => id !== target.recipientId);
      acc.sharedUserNames = acc.sharedUserNames?.filter((name) => name !== target.recipientName);
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Revoke Account Access',
      entity: 'Access Management',
      entityId: asgnId,
      details: `Revoked access on ${asgn.serviceName} for ${asgn.recipientName}. Reason: ${reason}.`,
    });
  });

  return res.json({ success: true, message: 'Access revoked successfully.' });
});

// GET /api/access/requests - List access-sharing requests
accessRouter.get('/requests', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.accessRequests);
});
