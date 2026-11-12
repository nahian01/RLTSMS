import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import {
  AccountAccessAssignment,
  AccountAccessHistory,
  AccessRequest,
  PredefinedAccessReason,
  ServiceAccount,
} from '../../src/types';

export const accessRouter = Router();

// ==============================================================================
// 1. PREDEFINED ACCESS REASONS (SUPER ADMIN CONFIGURABLE - PART 3.2 & 3.3)
// ==============================================================================

// GET /api/access/reasons - List active predefined reasons
accessRouter.get('/reasons', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  const reasons = (state.predefinedReasons || [])
    .filter((r) => !r.isArchived)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return res.json(reasons);
});

// POST /api/access/reasons - Create predefined reason (Super Admin)
accessRouter.post('/reasons', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, description, displayOrder } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Reason name is required.' });
  }

  const state = dbStore.getState();
  const existing = (state.predefinedReasons || []).find(
    (r) => r.name.toLowerCase() === name.trim().toLowerCase() && !r.isArchived
  );
  if (existing) {
    return res.status(409).json({ error: 'A predefined reason with this name already exists.' });
  }

  const newReason: PredefinedAccessReason = {
    id: `rsn-${Date.now()}`,
    name: name.trim(),
    description: description ? description.trim() : undefined,
    displayOrder: typeof displayOrder === 'number' ? displayOrder : (state.predefinedReasons?.length || 0) + 1,
    isEnabled: true,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    if (!s.predefinedReasons) s.predefinedReasons = [];
    s.predefinedReasons.push(newReason);
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: 'Administrator',
      action: 'Create Predefined Access Reason',
      entity: 'Access Management',
      entityId: newReason.id,
      details: `Created predefined access reason: ${newReason.name}`,
    });
  });

  return res.status(201).json(newReason);
});

// PUT /api/access/reasons/:id - Update predefined reason
accessRouter.put('/reasons/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const reasonId = req.params.id;
  const { name, description, displayOrder, isEnabled } = req.body;

  const state = dbStore.getState();
  const target = (state.predefinedReasons || []).find((r) => r.id === reasonId);
  if (!target) {
    return res.status(404).json({ error: 'Predefined reason not found.' });
  }

  dbStore.mutate((s) => {
    const r = (s.predefinedReasons || []).find((x) => x.id === reasonId);
    if (r) {
      if (name !== undefined) r.name = name.trim();
      if (description !== undefined) r.description = description ? description.trim() : undefined;
      if (displayOrder !== undefined) r.displayOrder = displayOrder;
      if (isEnabled !== undefined) r.isEnabled = Boolean(isEnabled);
      r.updatedAt = new Date().toISOString();

      s.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        userName: 'Administrator',
        action: 'Update Predefined Access Reason',
        entity: 'Access Management',
        entityId: reasonId,
        details: `Updated predefined access reason: ${r.name}`,
      });
    }
  });

  return res.json({ success: true, message: 'Reason updated successfully.' });
});

// DELETE /api/access/reasons/:id - Archive predefined reason
accessRouter.delete('/reasons/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const reasonId = req.params.id;

  const state = dbStore.getState();
  const target = (state.predefinedReasons || []).find((r) => r.id === reasonId);
  if (!target) {
    return res.status(404).json({ error: 'Predefined reason not found.' });
  }

  dbStore.mutate((s) => {
    const r = (s.predefinedReasons || []).find((x) => x.id === reasonId);
    if (r) {
      r.isArchived = true;
      r.isEnabled = false;
      r.updatedAt = new Date().toISOString();

      s.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        userName: 'Administrator',
        action: 'Archive Predefined Access Reason',
        entity: 'Access Management',
        entityId: reasonId,
        details: `Archived predefined access reason: ${r.name}`,
      });
    }
  });

  return res.json({ success: true, message: 'Reason archived successfully.' });
});

// ==============================================================================
// 2. EMPLOYEE SERVICE/TOOL ACCESS REQUESTS (PART 3)
// ==============================================================================

// GET /api/access/requests - List access requests
accessRouter.get('/requests', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.accessRequests);
});

// POST /api/access/requests - Submit new access request
accessRouter.post('/requests', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || req.body.requesterId || 'usr-1';
  const state = dbStore.getState();
  const user = state.users.find((u) => u.id === currentUserId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const {
    serviceId,
    requestedAccessType = 'Standard Seat',
    reasonId,
    reason,
    additionalExplanation,
    duration = 'Permanent',
    preferredAccountId,
  } = req.body;

  if (!serviceId) {
    return res.status(400).json({ error: 'Service is required.' });
  }

  const service = state.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  let finalReason = reason;
  if (reasonId) {
    const rObj = (state.predefinedReasons || []).find((r) => r.id === reasonId);
    if (rObj) finalReason = rObj.name;
  }
  if (!finalReason || !finalReason.trim()) {
    return res.status(400).json({ error: 'A business reason is required.' });
  }

  const reqNumber = `ACC-2026-${String(state.accessRequests.length + 15).padStart(3, '0')}`;
  const newRequest: AccessRequest = {
    id: `acc-req-${Date.now()}`,
    requestNumber: reqNumber,
    requesterId: user.id,
    requesterName: user.name,
    requesterEmail: user.email,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    teamId: user.teamId,
    teamName: user.teamName,
    serviceId,
    serviceName: service.name,
    serviceCategory: service.category,
    category: service.category,
    requestedAccessType,
    reason: finalReason,
    reasonId,
    additionalExplanation: additionalExplanation ? additionalExplanation.trim() : undefined,
    duration,
    preferredAccountId,
    status: 'Pending',
    workflowId: 'wf-access-1',
    currentStageIndex: 0,
    stages: [
      {
        stageId: 'stg-acc-1',
        stageName: 'Admin Approval & Seat Assignment',
        roleOrPosition: 'Super Admin',
        assignedApproverId: 'usr-admin',
        assignedApproverName: 'Abdullah Nahian',
        isRequired: true,
        status: 'Pending',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.accessRequests.unshift(newRequest);

    // Notify approver
    s.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: 'usr-admin',
      title: `New Access Request: ${service.name}`,
      message: `${user.name} (${user.departmentName}) requested ${requestedAccessType} on ${service.name}. Reason: ${finalReason}.`,
      type: 'access',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkAction: { view: 'access', id: newRequest.id },
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action: 'Submit Tool Access Request',
      entity: 'AccessRequest',
      entityId: newRequest.id,
      details: `${user.name} submitted access request ${reqNumber} for ${service.name} (${requestedAccessType}). Reason: ${finalReason}.`,
    });
  });

  return res.status(201).json(newRequest);
});

// GET /api/access/requests/:id - Get single access request
accessRouter.get('/requests/:id', (req: Request, res: Response) => {
  const state = dbStore.getState();
  const request = state.accessRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Access request not found.' });
  }
  return res.json(request);
});

// ==============================================================================
// 3. STREAMLINED 1-CLICK APPROVAL & ASSIGN ACCESS (PART 4)
// ==============================================================================

// POST /api/access/requests/:id/approve-and-assign - Atomic approval & assignment
accessRouter.post('/requests/:id/approve-and-assign', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const requestId = req.params.id;
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const request = state.accessRequests.find((r) => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: 'Access request not found.' });
  }

  const {
    accountId,
    startDate = new Date().toISOString().split('T')[0],
    expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    permissionLevel = 'user',
    notes,
  } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: 'Individual service account must be selected.' });
  }

  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) {
    return res.status(404).json({ error: 'Selected account not found.' });
  }

  if (account.serviceId !== request.serviceId) {
    return res.status(400).json({ error: 'Selected account does not belong to the requested service.' });
  }

  // Enforce account capacity
  const currentActiveSeats = (account.allocatedSeats !== undefined)
    ? account.allocatedSeats
    : (account.sharedUserIds?.length || 0);

  if (account.seatLimit && currentActiveSeats >= account.seatLimit) {
    return res.status(400).json({
      error: `Account capacity exceeded. Account ${account.accountEmail} has ${currentActiveSeats} of ${account.seatLimit} seats allocated.`,
    });
  }

  // Prevent duplicate active assignment
  const existingActive = state.accessAssignments.find(
    (a) =>
      a.accountId === accountId &&
      a.recipientType === 'employee' &&
      a.recipientId === request.requesterId &&
      a.status === 'Active'
  );

  if (existingActive) {
    return res.status(409).json({
      error: `Employee ${request.requesterName} already has active access to account ${account.accountEmail}.`,
    });
  }

  const asgnId = `asgn-${Date.now()}`;
  const newAssignment: AccountAccessAssignment = {
    id: asgnId,
    serviceId: request.serviceId,
    serviceName: request.serviceName,
    accountId: account.id,
    accountEmail: account.accountEmail,
    recipientType: 'employee',
    recipientId: request.requesterId,
    recipientName: request.requesterName,
    recipientEmail: request.requesterEmail,
    grantedById: currentUserId,
    grantedByName: currentUser ? currentUser.name : 'System Administrator',
    startDate,
    expirationDate,
    permissionLevel,
    status: 'Active',
    provisioningStatus: 'Provisioned',
    notes: notes ? notes.trim() : `Fulfilled request ${request.requestNumber}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const historyRecord: AccountAccessHistory = {
    id: `hist-${Date.now()}`,
    assignmentId: asgnId,
    serviceId: request.serviceId,
    serviceName: request.serviceName,
    accountId: account.id,
    accountEmail: account.accountEmail,
    recipientId: request.requesterId,
    recipientName: request.requesterName,
    recipientType: 'employee',
    action: 'grant',
    newExpiryDate: expirationDate,
    actorId: currentUserId,
    actorName: currentUser ? currentUser.name : 'System Administrator',
    reasonOrNotes: `Initial grant via 1-click approval for request ${request.requestNumber}`,
    timestamp: new Date().toISOString(),
  };

  // Atomic database update
  dbStore.mutate((s) => {
    // 1. Add assignment
    s.accessAssignments.unshift(newAssignment);

    // 2. Add history log
    if (!s.accessHistory) s.accessHistory = [];
    s.accessHistory.unshift(historyRecord);

    // 3. Update account capacity & allocation status
    const acc = s.accounts.find((a) => a.id === accountId);
    if (acc) {
      if (!acc.sharedUserIds) acc.sharedUserIds = [];
      if (!acc.sharedUserNames) acc.sharedUserNames = [];
      if (!acc.sharedUserIds.includes(request.requesterId)) {
        acc.sharedUserIds.push(request.requesterId);
        acc.sharedUserNames.push(request.requesterName);
      }
      acc.allocatedSeats = (acc.allocatedSeats || 0) + 1;
      if (acc.seatLimit && acc.allocatedSeats >= acc.seatLimit) {
        acc.accountStatus = 'Assigned';
      } else {
        acc.accountStatus = 'Partially Assigned';
      }
    }

    // 4. Mark request fulfilled
    const reqTarget = s.accessRequests.find((r) => r.id === requestId);
    if (reqTarget) {
      reqTarget.status = 'Fulfilled';
      reqTarget.assignedAccountId = account.id;
      reqTarget.assignedAccountEmail = account.accountEmail;
      reqTarget.assignedPlanName = account.planName;
      reqTarget.accessGrantedDate = new Date().toISOString();
      reqTarget.accessGrantedById = currentUserId;
      reqTarget.accessGrantedByName = currentUser ? currentUser.name : 'System Administrator';
      reqTarget.reviewedById = currentUserId;
      reqTarget.reviewedByName = currentUser ? currentUser.name : 'System Administrator';
      reqTarget.approvalDate = new Date().toISOString();
      reqTarget.accessNotes = notes;
      reqTarget.updatedAt = new Date().toISOString();

      if (reqTarget.stages && reqTarget.stages[0]) {
        reqTarget.stages[0].status = 'Approved';
        reqTarget.stages[0].actionDate = new Date().toISOString();
        reqTarget.stages[0].actorName = currentUser ? currentUser.name : 'System Administrator';
      }
    }

    // 5. Send zero-credential notification to employee
    s.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: request.requesterId,
      title: `Access Authorized: ${request.serviceName}`,
      message: `Your access request ${request.requestNumber} for ${request.serviceName} has been approved and provisioned through ${expirationDate}.`,
      type: 'access',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkAction: { view: 'access' },
    });

    s.emailLogs.unshift({
      id: `elog-${Date.now()}`,
      templateKey: 'access_notification',
      templateName: 'Tool & Service Access Status Notice',
      recipientEmail: request.requesterEmail,
      recipientName: request.requesterName,
      subject: `RLTSMS Access Granted: ${request.serviceName}`,
      status: 'Sent',
      attemptCount: 1,
      providerMessageId: `msg_${Date.now()}`,
      dispatchedAt: new Date().toISOString(),
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Administrator',
      action: 'Approve & Assign Access',
      entity: 'AccessRequest',
      entityId: requestId,
      details: `Approved request ${request.requestNumber} and assigned account ${account.accountEmail} to ${request.requesterName} until ${expirationDate}.`,
    });
  });

  return res.json({
    success: true,
    message: `Access approved and assigned to ${request.requesterName}.`,
    assignment: newAssignment,
  });
});

// ==============================================================================
// 4. ASSIGNMENT MANAGEMENT: EDIT, EXTEND, REVOKE & HISTORY (PARTS 4.1, 4.2, 9)
// ==============================================================================

// POST /api/access/assignments - Create manual access assignment (Zero Credentials)
accessRouter.post('/assignments', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const {
    serviceId,
    accountId,
    recipientType = 'employee',
    recipientId,
    startDate,
    expirationDate,
    permissionLevel = 'user',
    notes,
  } = req.body;

  if (!serviceId || !accountId || !recipientId) {
    return res.status(400).json({ error: 'serviceId, accountId, and recipientId are required.' });
  }

  const state = dbStore.getState();
  const service = state.services.find((s) => s.id === serviceId);
  const account = state.accounts.find((a) => a.id === accountId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!service || !account) {
    return res.status(404).json({ error: 'Service or account not found.' });
  }

  // Lookup recipient details
  let recipientName = 'Unknown Recipient';
  let recipientEmail = 'unknown@riseuplabs.com';
  let departmentId: string | undefined;
  let departmentName: string | undefined;
  let teamId: string | undefined;
  let teamName: string | undefined;

  if (recipientType === 'employee') {
    const user = state.users.find((u) => u.id === recipientId);
    if (user) {
      recipientName = user.name;
      recipientEmail = user.email;
      departmentId = user.departmentId;
      departmentName = user.departmentName;
      teamId = user.teamId;
      teamName = user.teamName;
    }
  } else if (recipientType === 'team') {
    const team = state.teams.find((t) => t.id === recipientId);
    if (team) {
      recipientName = team.name;
      recipientEmail = `${team.name.toLowerCase().replace(/\s+/g, '-')}@riseuplabs.com`;
      departmentId = team.departmentId;
      departmentName = team.departmentName;
    }
  } else if (recipientType === 'department') {
    const dept = state.departments.find((d) => d.id === recipientId);
    if (dept) {
      recipientName = dept.name;
      recipientEmail = `${dept.name.toLowerCase().replace(/\s+/g, '-')}@riseuplabs.com`;
      departmentId = dept.id;
      departmentName = dept.name;
    }
  }

  const asgnId = `asgn-${Date.now()}`;
  const start = startDate || new Date().toISOString().split('T')[0];
  const newAssignment: AccountAccessAssignment = {
    id: asgnId,
    serviceId: service.id,
    serviceName: service.name,
    accountId: account.id,
    accountEmail: account.accountEmail,
    recipientType,
    recipientId,
    recipientName,
    recipientEmail,
    departmentId,
    departmentName,
    teamId,
    teamName,
    grantedById: currentUserId,
    grantedByName: currentUser ? currentUser.name : 'System Administrator',
    startDate: start,
    expirationDate: expirationDate || undefined,
    permissionLevel,
    status: 'Active',
    provisioningStatus: 'Provisioned',
    notes: notes ? notes.trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const historyRecord: AccountAccessHistory = {
    id: `hist-${Date.now()}`,
    assignmentId: asgnId,
    serviceId: service.id,
    serviceName: service.name,
    accountId: account.id,
    accountEmail: account.accountEmail,
    recipientId,
    recipientName,
    recipientType,
    action: 'grant',
    newExpiryDate: expirationDate,
    actorId: currentUserId,
    actorName: currentUser ? currentUser.name : 'System Administrator',
    reasonOrNotes: notes || 'Administrative access grant',
    timestamp: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.accessAssignments.unshift(newAssignment);
    if (!s.accessHistory) s.accessHistory = [];
    s.accessHistory.unshift(historyRecord);

    const acc = s.accounts.find((a) => a.id === accountId);
    if (acc) {
      acc.allocatedSeats = (acc.allocatedSeats || 0) + 1;
      if (!acc.sharedUserIds) acc.sharedUserIds = [];
      if (!acc.sharedUserNames) acc.sharedUserNames = [];
      if (recipientType === 'employee' && !acc.sharedUserIds.includes(recipientId)) {
        acc.sharedUserIds.push(recipientId);
        acc.sharedUserNames.push(recipientName);
      }
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Administrator',
      action: 'Grant Account Access',
      entity: 'AccessAssignment',
      entityId: asgnId,
      details: `Granted ${permissionLevel} access to ${service.name} (${account.accountEmail}) for ${recipientName}.`,
    });
  });

  return res.status(201).json(newAssignment);
});

// GET /api/access/assignments - List assignments
accessRouter.get('/assignments', (req: Request, res: Response) => {
  const { status, recipientType, serviceId, accountId } = req.query;
  const state = dbStore.getState();

  // Run automatic expiration check
  const today = new Date().toISOString().split('T')[0];
  let hasExpiredUpdates = false;

  state.accessAssignments.forEach((asgn) => {
    if (asgn.status === 'Active' && asgn.expirationDate && asgn.expirationDate < today) {
      asgn.status = 'Expired';
      hasExpiredUpdates = true;
    }
  });

  if (hasExpiredUpdates) {
    dbStore.mutate(() => {});
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
  if (accountId && accountId !== 'all') {
    list = list.filter((a) => a.accountId === accountId);
  }

  return res.json(list);
});

// PUT /api/access/assignments/:id - Edit assignment details
accessRouter.put('/assignments/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const asgnId = req.params.id;
  const state = dbStore.getState();
  const asgn = state.accessAssignments.find((a) => a.id === asgnId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!asgn) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const { permissionLevel, expirationDate, provisioningStatus, notes } = req.body;

  dbStore.mutate((s) => {
    const target = s.accessAssignments.find((a) => a.id === asgnId)!;
    if (permissionLevel) target.permissionLevel = permissionLevel;
    if (expirationDate) target.expirationDate = expirationDate;
    if (provisioningStatus) target.provisioningStatus = provisioningStatus;
    if (notes !== undefined) target.notes = notes;
    target.updatedAt = new Date().toISOString();

    if (!s.accessHistory) s.accessHistory = [];
    s.accessHistory.unshift({
      id: `hist-${Date.now()}`,
      assignmentId: asgnId,
      serviceId: target.serviceId,
      serviceName: target.serviceName,
      accountId: target.accountId,
      accountEmail: target.accountEmail,
      recipientId: target.recipientId,
      recipientName: target.recipientName,
      recipientType: target.recipientType,
      action: 'edit',
      newExpiryDate: target.expirationDate,
      actorId: currentUserId,
      actorName: currentUser ? currentUser.name : 'System Administrator',
      reasonOrNotes: notes || 'Updated assignment settings',
      timestamp: new Date().toISOString(),
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Administrator',
      action: 'Edit Account Access',
      entity: 'Access Management',
      entityId: asgnId,
      details: `Modified access assignment for ${target.recipientName} on ${target.serviceName}.`,
    });
  });

  return res.json({ success: true, message: 'Assignment updated successfully.' });
});

// POST /api/access/assignments/:id/extend - Extend access period
accessRouter.post('/assignments/:id/extend', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { newExpirationDate, reason } = req.body;
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

    if (!s.accessHistory) s.accessHistory = [];
    s.accessHistory.unshift({
      id: `hist-${Date.now()}`,
      assignmentId: asgnId,
      serviceId: target.serviceId,
      serviceName: target.serviceName,
      accountId: target.accountId,
      accountEmail: target.accountEmail,
      recipientId: target.recipientId,
      recipientName: target.recipientName,
      recipientType: target.recipientType,
      action: 'extend',
      previousExpiryDate: prevExpiry,
      newExpiryDate: newExpirationDate,
      actorId: currentUserId,
      actorName: currentUser ? currentUser.name : 'System Administrator',
      reasonOrNotes: reason || 'Access extended by administrator',
      timestamp: new Date().toISOString(),
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Extend Account Access',
      entity: 'Access Management',
      entityId: asgnId,
      details: `Extended access on ${asgn.serviceName} for ${asgn.recipientName} from ${prevExpiry} to ${newExpirationDate}. Reason: ${reason || 'N/A'}.`,
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

    // Decrement account allocated capacity & clean sharedUserIds
    const acc = s.accounts.find((a) => a.id === target.accountId);
    if (acc) {
      if (acc.sharedUserIds) {
        acc.sharedUserIds = acc.sharedUserIds.filter((id) => id !== target.recipientId);
        acc.sharedUserNames = acc.sharedUserNames?.filter((name) => name !== target.recipientName);
      }
      acc.allocatedSeats = Math.max(0, (acc.allocatedSeats || 1) - 1);
      if (acc.allocatedSeats === 0) {
        acc.accountStatus = 'Available';
      } else {
        acc.accountStatus = 'Partially Assigned';
      }
    }

    if (!s.accessHistory) s.accessHistory = [];
    s.accessHistory.unshift({
      id: `hist-${Date.now()}`,
      assignmentId: asgnId,
      serviceId: target.serviceId,
      serviceName: target.serviceName,
      accountId: target.accountId,
      accountEmail: target.accountEmail,
      recipientId: target.recipientId,
      recipientName: target.recipientName,
      recipientType: target.recipientType,
      action: 'revoke',
      previousExpiryDate: target.expirationDate,
      actorId: currentUserId,
      actorName: currentUser ? currentUser.name : 'System Administrator',
      reasonOrNotes: reason,
      timestamp: new Date().toISOString(),
    });

    // Notify employee of revocation
    if (target.recipientType === 'employee') {
      s.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: target.recipientId,
        title: `Access Revoked: ${target.serviceName}`,
        message: `Your access to ${target.serviceName} has been revoked. Reason: ${reason}.`,
        type: 'access',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkAction: { view: 'access' },
      });
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

// GET /api/access/assignments/:id/history - Get assignment history
accessRouter.get('/assignments/:id/history', (req: Request, res: Response) => {
  const asgnId = req.params.id;
  const state = dbStore.getState();
  const history = (state.accessHistory || []).filter((h) => h.assignmentId === asgnId);
  return res.json(history);
});

// ==============================================================================
// 5. CENTRALIZED SERVICES & TOOLS SHARING HUB API (PARTS 5, 6, 7, 8, 11)
// ==============================================================================

// GET /api/access/sharing/services - Master List of services with account counts
accessRouter.get('/sharing/services', (_req: Request, res: Response) => {
  const state = dbStore.getState();

  const result = state.services.map((service) => {
    const serviceAccounts = state.accounts.filter((a) => a.serviceId === service.id);
    const serviceAssignments = state.accessAssignments.filter(
      (a) => a.serviceId === service.id && a.status === 'Active'
    );
    const serviceSubscription = state.subscriptions.find((s) => s.serviceId === service.id);

    const totalAccounts = serviceAccounts.length;
    const activeAccounts = serviceAccounts.filter((a) =>
      ['Active', 'Assigned', 'Partially Assigned'].includes(a.accountStatus)
    ).length;

    const availableAccounts = serviceAccounts.filter((a) => {
      if (a.accountStatus === 'Available') return true;
      if (a.seatLimit && (a.allocatedSeats || 0) < a.seatLimit) return true;
      return false;
    }).length;

    const partiallyAllocatedAccounts = serviceAccounts.filter(
      (a) => a.accountStatus === 'Partially Assigned' || ((a.allocatedSeats || 0) > 0 && a.seatLimit && (a.allocatedSeats || 0) < a.seatLimit)
    ).length;

    const assignedEmployees = new Set(
      serviceAssignments.filter((a) => a.recipientType === 'employee').map((a) => a.recipientId)
    ).size;

    let allocationStatus: 'Fully Available' | 'Partially Allocated' | 'Fully Allocated' | 'Inactive' = 'Fully Available';
    if (activeAccounts === 0) {
      allocationStatus = 'Inactive';
    } else if (availableAccounts === 0) {
      allocationStatus = 'Fully Allocated';
    } else if (partiallyAllocatedAccounts > 0 || (activeAccounts > availableAccounts)) {
      allocationStatus = 'Partially Allocated';
    }

    return {
      id: service.id,
      serviceId: service.id,
      name: service.name,
      serviceName: service.name,
      category: service.category,
      provider: service.provider,
      website: service.website,
      status: service.status,
      totalAccounts,
      activeAccounts,
      availableAccounts,
      partiallyAllocatedAccounts,
      allocationStatus,
      assignedEmployeesCount: assignedEmployees,
      activeAssignmentsCount: serviceAssignments.length,
      nextRenewalDate: serviceSubscription?.nextRenewalDate || serviceAccounts[0]?.nextRenewalDate,
      subscriptionStatus: serviceSubscription?.status || 'Active',
    };
  });

  return res.json(result);
});

// GET /api/access/sharing/services/:serviceId/accounts - Accounts under service
accessRouter.get('/sharing/services/:serviceId/accounts', (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const state = dbStore.getState();

  const accounts = state.accounts.filter((a) => a.serviceId === serviceId);

  const result = accounts.map((acc) => {
    const activeAssignments = state.accessAssignments.filter(
      (a) => a.accountId === acc.id && a.status === 'Active'
    );

    const depts = new Set<string>();
    const teams = new Set<string>();
    const employees = new Set<string>();

    activeAssignments.forEach((a) => {
      if (a.recipientType === 'department') depts.add(a.recipientId);
      if (a.recipientType === 'team') teams.add(a.recipientId);
      if (a.recipientType === 'employee') employees.add(a.recipientId);
    });

    // Upcoming nearest event (renewal or earliest expiration)
    const sub = state.subscriptions.find((s) => s.accountId === acc.id || s.serviceId === acc.serviceId);
    const renewalDate = sub?.nextRenewalDate || acc.nextRenewalDate;

    let nearestExpiry: string | undefined = undefined;
    activeAssignments.forEach((a) => {
      if (a.expirationDate) {
        if (!nearestExpiry || a.expirationDate < nearestExpiry) {
          nearestExpiry = a.expirationDate;
        }
      }
    });

    return {
      id: acc.id,
      serviceId: acc.serviceId,
      serviceName: acc.serviceName,
      accountEmail: acc.accountEmail,
      planName: acc.planName,
      status: acc.accountStatus,
      allocationModel: acc.allocationModel || 'seat_based',
      seatLimit: acc.seatLimit,
      allocatedSeats: acc.allocatedSeats || activeAssignments.length,
      availableSeats: acc.seatLimit ? Math.max(0, acc.seatLimit - (acc.allocatedSeats || activeAssignments.length)) : null,
      departmentAllocationCount: depts.size,
      teamAllocationCount: teams.size,
      employeeAllocationCount: employees.size,
      totalActiveAssignments: activeAssignments.length,
      subscriptionRenewalDate: renewalDate,
      nearestExpiryDate: nearestExpiry,
      currency: acc.currency,
      billingCycle: acc.billingCycle,
    };
  });

  return res.json(result);
});

// GET /api/access/sharing/accounts/:accountId/assignments - Assignments under an account
accessRouter.get('/sharing/accounts/:accountId/assignments', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const state = dbStore.getState();

  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const assignments = state.accessAssignments.filter((a) => a.accountId === accountId);
  const sub = state.subscriptions.find((s) => s.accountId === accountId || s.serviceId === account.serviceId);

  const result = assignments.map((asgn) => {
    let deptName = 'General';
    let teamName = 'General';

    if (asgn.recipientType === 'employee') {
      const u = state.users.find((x) => x.id === asgn.recipientId);
      if (u) {
        deptName = u.departmentName;
        teamName = u.teamName || 'General';
      }
    } else if (asgn.recipientType === 'team') {
      const t = state.teams.find((x) => x.id === asgn.recipientId);
      if (t) {
        teamName = t.name;
        deptName = t.departmentName;
      }
    } else if (asgn.recipientType === 'department') {
      const d = state.departments.find((x) => x.id === asgn.recipientId);
      if (d) deptName = d.name;
    }

    return {
      ...asgn,
      departmentName: deptName,
      teamName: teamName,
      planName: account.planName,
      subscriptionRenewalDate: sub?.nextRenewalDate || account.nextRenewalDate,
    };
  });

  return res.json({
    account: {
      ...account,
      subscriptionStatus: sub?.status || 'Active',
      subscriptionRenewalDate: sub?.nextRenewalDate || account.nextRenewalDate,
      totalActiveAssignments: assignments.filter((a) => a.status === 'Active').length,
      totalExpiredAssignments: assignments.filter((a) => a.status === 'Expired').length,
    },
    assignments: result,
  });
});

// GET /api/access/upcoming-events - Unified upcoming renewal and expiration timeline
accessRouter.get('/upcoming-events', (req: Request, res: Response) => {
  const { days = '30' } = req.query;
  const daysNum = parseInt(days as string, 10) || 30;
  const now = new Date();
  const limitDate = new Date(now.getTime() + daysNum * 24 * 60 * 60 * 1000);

  const state = dbStore.getState();
  const events: any[] = [];

  // 1. Subscription renewals
  state.subscriptions.forEach((sub) => {
    if (sub.nextRenewalDate && sub.status === 'Active') {
      const rDate = new Date(sub.nextRenewalDate);
      const diffMs = rDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= daysNum) {
        events.push({
          id: `evt-sub-${sub.id}`,
          type: 'Subscription Renewal',
          eventCategory: 'subscription_renewal',
          title: `${sub.serviceName} Subscription Renewal`,
          serviceName: sub.serviceName,
          targetIdentifier: sub.accountEmail || sub.planName,
          date: sub.nextRenewalDate,
          daysRemaining: diffDays,
          amount: sub.currentAmount,
          currency: sub.currency,
          severity: diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'warning' : 'info',
        });
      }
    }
  });

  // 2. Access assignment expirations
  state.accessAssignments.forEach((asgn) => {
    if (asgn.expirationDate && asgn.status === 'Active') {
      const eDate = new Date(asgn.expirationDate);
      const diffMs = eDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= daysNum) {
        events.push({
          id: `evt-asgn-${asgn.id}`,
          type: 'Access Expiration',
          eventCategory: 'access_expiration',
          title: `${asgn.recipientName} (${asgn.recipientType}) Access Expiring`,
          serviceName: asgn.serviceName,
          targetIdentifier: `${asgn.accountEmail} - ${asgn.recipientName}`,
          date: asgn.expirationDate,
          daysRemaining: diffDays,
          recipientType: asgn.recipientType,
          recipientName: asgn.recipientName,
          severity: diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'warning' : 'info',
        });
      }
    }
  });

  events.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return res.json(events);
});
