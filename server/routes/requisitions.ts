import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { Requisition, ApprovalStageAction } from '../../src/types';

export const requisitionsRouter = Router();

// GET /api/requisitions - List requisitions with status filtering
requisitionsRouter.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  const state = dbStore.getState();
  let list = state.requisitions;

  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }

  return res.json(list);
});

// POST /api/requisitions - Create new requisition
requisitionsRouter.post('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const {
    serviceName,
    serviceId,
    type = 'Tool',
    category,
    subcategory,
    purpose,
    requestedPlan,
    estimatedAmount,
    currency = 'USD',
    billingCycle = 'Monthly',
    expectedPurchaseDate,
    notes,
    status = 'Submitted',
  } = req.body;

  if (!serviceName || !purpose || !requestedPlan || estimatedAmount === undefined) {
    return res.status(400).json({ error: 'Missing required requisition parameters.' });
  }

  const defaultStages: ApprovalStageAction[] = [
    {
      stageId: 'stg-1',
      stageName: 'Team Lead Technical Review',
      roleOrPosition: 'Team Lead',
      isRequired: true,
      status: 'Pending',
    },
    {
      stageId: 'stg-2',
      stageName: 'Department Head Budgetary Approval',
      roleOrPosition: 'Department Lead',
      isRequired: true,
      status: 'Pending',
    },
    {
      stageId: 'stg-3',
      stageName: 'Operations Manager Strategic Review',
      roleOrPosition: 'Operation Manager',
      isRequired: false,
      status: 'Pending',
    },
  ];

  const reqNumber = `REQ-2026-${String(state.requisitions.length + 80).padStart(3, '0')}`;

  const newReq: Requisition = {
    id: `req-${Date.now()}`,
    requisitionNumber: reqNumber,
    requesterId: currentUserId,
    requesterName: currentUser ? currentUser.name : 'Employee',
    requesterEmail: currentUser ? currentUser.email : '',
    departmentId: currentUser ? currentUser.departmentId : 'dept-1',
    departmentName: currentUser ? currentUser.departmentName : 'Engineering',
    teamId: currentUser?.teamId,
    teamName: currentUser?.teamName,
    serviceId,
    serviceName: serviceName.trim(),
    isNewServiceProposal: !serviceId,
    type,
    category: category || 'AI Tools',
    subcategory: subcategory || category || 'AI Tools',
    purpose: purpose.trim(),
    requestedPlan: requestedPlan.trim(),
    billingCycle,
    estimatedAmount: Number(estimatedAmount),
    currency,
    expectedPurchaseDate: expectedPurchaseDate || new Date().toISOString().split('T')[0],
    notes: notes ? notes.trim() : undefined,
    status: status === 'Draft' ? 'Draft' : 'Pending Approval',
    workflowId: 'wf-1',
    currentStageIndex: 0,
    stages: defaultStages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.requisitions.unshift(newReq);

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Create Requisition',
      entity: 'Requisitions',
      entityId: newReq.id,
      details: `Created requisition ${newReq.requisitionNumber} for ${newReq.serviceName} ($${newReq.estimatedAmount} ${newReq.currency}).`,
    });
  });

  return res.status(201).json(newReq);
});

// POST /api/requisitions/:id/approve - Approve current stage
requisitionsRouter.post('/:id/approve', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const reqId = req.params.id;
  const { comment } = req.body;

  const state = dbStore.getState();
  const requisition = state.requisitions.find((r) => r.id === reqId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!requisition) {
    return res.status(404).json({ error: 'Requisition not found.' });
  }

  dbStore.mutate((s) => {
    const target = s.requisitions.find((r) => r.id === reqId)!;
    const currentStage = target.stages[target.currentStageIndex];

    if (currentStage) {
      currentStage.status = 'Approved';
      currentStage.actionDate = new Date().toISOString();
      currentStage.comment = comment ? comment.trim() : 'Approved';
      currentStage.actorName = currentUser ? currentUser.name : 'Approver';
      currentStage.assignedApproverId = currentUserId;
      currentStage.assignedApproverName = currentUser ? currentUser.name : 'Approver';
    }

    // Check if more stages remain
    if (target.currentStageIndex + 1 < target.stages.length) {
      target.currentStageIndex += 1;
      target.status = 'Pending Approval';
    } else {
      // All stages completed -> Auto route to Pending Purchase / Approved
      target.status = 'Approved';
      target.approvedAmount = target.estimatedAmount;
    }

    target.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Approver',
      action: 'Approve Requisition Stage',
      entity: 'Requisitions',
      entityId: reqId,
      details: `Approved stage on ${target.requisitionNumber} (${target.serviceName}). Current status: ${target.status}.`,
    });
  });

  return res.json({ success: true, message: 'Requisition stage approved.' });
});

// POST /api/requisitions/:id/reject - Reject requisition
requisitionsRouter.post('/:id/reject', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const reqId = req.params.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'A justification comment is required to reject a requisition.' });
  }

  const state = dbStore.getState();
  const requisition = state.requisitions.find((r) => r.id === reqId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!requisition) {
    return res.status(404).json({ error: 'Requisition not found.' });
  }

  dbStore.mutate((s) => {
    const target = s.requisitions.find((r) => r.id === reqId)!;
    const currentStage = target.stages[target.currentStageIndex];

    if (currentStage) {
      currentStage.status = 'Rejected';
      currentStage.actionDate = new Date().toISOString();
      currentStage.comment = comment.trim();
      currentStage.actorName = currentUser ? currentUser.name : 'Reviewer';
    }

    target.status = 'Rejected';
    target.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Reviewer',
      action: 'Reject Requisition',
      entity: 'Requisitions',
      entityId: reqId,
      details: `Rejected requisition ${target.requisitionNumber}. Reason: ${comment.trim()}`,
    });
  });

  return res.json({ success: true, message: 'Requisition rejected.' });
});

// POST /api/requisitions/:id/return - Return for modification
requisitionsRouter.post('/:id/return', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const reqId = req.params.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'A review comment is required to return a requisition.' });
  }

  const state = dbStore.getState();
  const requisition = state.requisitions.find((r) => r.id === reqId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!requisition) {
    return res.status(404).json({ error: 'Requisition not found.' });
  }

  dbStore.mutate((s) => {
    const target = s.requisitions.find((r) => r.id === reqId)!;
    const currentStage = target.stages[target.currentStageIndex];

    if (currentStage) {
      currentStage.status = 'Returned';
      currentStage.actionDate = new Date().toISOString();
      currentStage.comment = comment.trim();
      currentStage.actorName = currentUser ? currentUser.name : 'Reviewer';
    }

    target.status = 'Returned for Modification';
    target.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Reviewer',
      action: 'Return Requisition for Modification',
      entity: 'Requisitions',
      entityId: reqId,
      details: `Returned requisition ${target.requisitionNumber} for modification. Feedback: ${comment.trim()}`,
    });
  });

  return res.json({ success: true, message: 'Requisition returned for modification.' });
});
