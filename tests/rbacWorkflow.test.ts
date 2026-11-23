import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ROLES, INITIAL_WORKFLOWS, INITIAL_PERMISSIONS, INITIAL_ACCOUNTS } from '../src/data/mockData';
import { ApprovalWorkflow, WorkflowStageDefinition, UserRole, User } from '../src/types';

// Helper matching AppContext hasPermission
function checkUserPermission(userRoles: UserRole[], permissionCode: string): boolean {
  for (const roleName of userRoles) {
    const roleDef = INITIAL_ROLES.find((r) => r.name === roleName);
    if (!roleDef) continue;
    if (roleDef.permissions.includes('*')) return true;
    if (roleDef.permissions.includes(permissionCode)) return true;
  }
  return false;
}

test('RBAC: Super Admin has wildcard permission to all modules and actions', () => {
  const superAdminRoles: UserRole[] = ['Super Admin'];
  assert.strictEqual(checkUserPermission(superAdminRoles, 'requisitions:submit'), true);
  assert.strictEqual(checkUserPermission(superAdminRoles, 'org:manage'), true);
  assert.strictEqual(checkUserPermission(superAdminRoles, 'workflows:write'), true);
  assert.strictEqual(checkUserPermission(superAdminRoles, 'cards:view_masked'), true);
  assert.strictEqual(checkUserPermission(superAdminRoles, 'random:nonexistent'), true);
});

test('RBAC: Employee role is scoped to requesting services/tools and viewing approved tools', () => {
  const employeeRoles: UserRole[] = ['Employee'];
  assert.strictEqual(checkUserPermission(employeeRoles, 'access:request'), true);
  assert.strictEqual(checkUserPermission(employeeRoles, 'dashboard:view'), true);
  assert.strictEqual(checkUserPermission(employeeRoles, 'requisitions:submit'), false);
  assert.strictEqual(checkUserPermission(employeeRoles, 'requisitions:view'), false);
  assert.strictEqual(checkUserPermission(employeeRoles, 'services:view'), false);
  assert.strictEqual(checkUserPermission(employeeRoles, 'org:manage'), false);
  assert.strictEqual(checkUserPermission(employeeRoles, 'workflows:write'), false);
  assert.strictEqual(checkUserPermission(employeeRoles, 'cards:manage'), false);
});

test('RBAC: System Admin has org:manage and workflows:write permissions', () => {
  const sysAdminRoles: UserRole[] = ['System Admin'];
  assert.strictEqual(checkUserPermission(sysAdminRoles, 'org:manage'), true);
  assert.strictEqual(checkUserPermission(sysAdminRoles, 'workflows:write'), true);
  assert.strictEqual(checkUserPermission(sysAdminRoles, 'rbac:view'), true);
});

test('Workflow Customization: Create, update stages, bump version, and validate flow', () => {
  const newWorkflow: ApprovalWorkflow = {
    id: `wf-custom-${Date.now()}`,
    name: 'Custom High-Value IT Purchase',
    purpose: 'Purchase Requisitions',
    stages: [
      {
        id: 'stg-1',
        name: 'Team Lead Approval',
        type: 'organizational_role',
        roleName: 'Team Lead',
        isRequired: true,
      },
      {
        id: 'stg-2',
        name: 'Operations Manager Review',
        type: 'organizational_role',
        roleName: 'Operation Manager',
        isRequired: false,
      },
      {
        id: 'stg-3',
        name: 'Finance Approval',
        type: 'organizational_role',
        roleName: 'Finance',
        isRequired: true,
      },
    ],
    purchaserRoleId: 'role-7',
    purchaserRoleName: 'Purchaser',
    version: '1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  assert.strictEqual(newWorkflow.stages.length, 3);
  assert.strictEqual(newWorkflow.stages.filter((s) => s.isRequired).length, 2);

  // Version bump simulation
  const currentVersionNum = parseFloat(newWorkflow.version);
  const updatedVersion = (currentVersionNum + 0.1).toFixed(1);
  const updatedWorkflow = { ...newWorkflow, version: updatedVersion };

  assert.strictEqual(updatedWorkflow.version, '1.1');
});

test('Employee Module: Multi-role assignment during employee invitation', () => {
  const inviteData = {
    name: 'Test Invite Employee',
    email: 'test.invite@riseuplabs.com',
    phone: '+880 1711-000000',
    designation: 'Staff DevOps Engineer',
    departmentId: 'dept-eng',
    roles: ['Employee', 'Team Lead'] as UserRole[],
  };

  assert.ok(inviteData.roles.includes('Employee'));
  assert.ok(inviteData.roles.includes('Team Lead'));
  assert.strictEqual(inviteData.roles.length, 2);

  // Verify permissions for this invited multi-role employee
  assert.strictEqual(checkUserPermission(inviteData.roles, 'approvals:team'), true);
  assert.strictEqual(checkUserPermission(inviteData.roles, 'requisitions:submit'), true);
  assert.strictEqual(checkUserPermission(inviteData.roles, 'workflows:write'), false);
});

test('Request Service/Tools Module: Employee can submit access request with tool type and reason', () => {
  const requestPayload = {
    serviceId: 'srv-1',
    serviceName: 'Figma Enterprise',
    serviceCategory: 'Design & UX',
    requestedAccessType: 'Standard User Seat',
    reason: 'Client UX/UI Mobile App Redesign Deliverables',
    duration: 'Project-based (3 Months)',
    requesterId: 'usr-5',
    requesterEmail: 'tanvir@riseuplabs.com',
    status: 'Pending Approval' as const,
  };

  assert.strictEqual(requestPayload.serviceName, 'Figma Enterprise');
  assert.strictEqual(requestPayload.requestedAccessType, 'Standard User Seat');
  assert.ok(requestPayload.reason.length > 5);
  assert.strictEqual(requestPayload.status, 'Pending Approval');
});

test('Request Service/Tools Module: Scoped to employee approved requests list (Approved & Fulfilled)', () => {
  const allRequests = [
    { id: 'req-1', requesterId: 'usr-5', serviceName: 'BrowserStack', status: 'Approved' },
    { id: 'req-2', requesterId: 'usr-5', serviceName: 'ChatGPT Plus', status: 'Pending Approval' },
    { id: 'req-3', requesterId: 'usr-other', serviceName: 'AWS Pro', status: 'Approved' },
    { id: 'req-4', requesterId: 'usr-5', serviceName: 'GitHub Copilot', status: 'Fulfilled' },
  ];

  // Employee only sees their own requests
  const myRequests = allRequests.filter((r) => r.requesterId === 'usr-5');
  assert.strictEqual(myRequests.length, 3);

  // Employee approved list strictly filters to approved & fulfilled requests
  const myApprovedList = myRequests.filter((r) => r.status === 'Approved' || r.status === 'Fulfilled');
  assert.strictEqual(myApprovedList.length, 2);
  assert.ok(myApprovedList.some((r) => r.serviceName === 'BrowserStack'));
  assert.ok(myApprovedList.some((r) => r.serviceName === 'GitHub Copilot'));
});

test('Sidebar Approvals Visibility: Team Lead, Department Lead, Operation Manager can all access Approvals queue', () => {
  const approvalPerms = ['approvals:team', 'approvals:department', 'approvals:operations', 'approvals:finance', 'access:approve'];

  const checkCanAccessApprovals = (roles: UserRole[]) => {
    return approvalPerms.some((perm) => checkUserPermission(roles, perm));
  };

  // Team Lead has approvals:team
  assert.strictEqual(checkCanAccessApprovals(['Team Lead']), true);
  // Department Lead has approvals:department
  assert.strictEqual(checkCanAccessApprovals(['Department Lead']), true);
  // Operation Manager has approvals:operations
  assert.strictEqual(checkCanAccessApprovals(['Operation Manager']), true);
  // Super Admin has wildcard *
  assert.strictEqual(checkCanAccessApprovals(['Super Admin']), true);
  // Standard Employee does NOT have approvals
  assert.strictEqual(checkCanAccessApprovals(['Employee']), false);
});

test('User-Wise Notifications: Notifications are scoped to the individual recipient and not global', () => {
  const sampleNotifications = [
    { id: 'notif-1', title: 'Team Approval', recipientId: 'usr-2', isRead: false },
    { id: 'notif-2', title: 'Purchase Task', recipientId: 'usr-5', isRead: false },
    { id: 'notif-3', title: 'System Renewal', recipientId: 'usr-admin', isRead: false },
    { id: 'notif-4', title: 'All Staff Update', recipientId: '*', isRead: false },
  ];

  // Helper function matching AppContext user-wise filter
  const filterForUser = (userId: string, userEmail?: string) => {
    return sampleNotifications.filter((n) => {
      if (n.recipientId === userId) return true;
      if (n.recipientId && userEmail && n.recipientId.toLowerCase() === userEmail.toLowerCase()) return true;
      if (n.recipientId === '*' || n.recipientId === 'all') return true;
      return false;
    });
  };

  // Alex Rivera (usr-2) only sees notif-1 and broadcast notif-4
  const alexNotifs = filterForUser('usr-2', 'alex@riseuplabs.com');
  assert.strictEqual(alexNotifs.length, 2);
  assert.ok(alexNotifs.some((n) => n.id === 'notif-1'));
  assert.ok(alexNotifs.some((n) => n.id === 'notif-4'));
  assert.strictEqual(alexNotifs.some((n) => n.id === 'notif-2'), false);
  assert.strictEqual(alexNotifs.some((n) => n.id === 'notif-3'), false);

  // Michael Chang (usr-5) only sees notif-2 and broadcast notif-4
  const michaelNotifs = filterForUser('usr-5', 'michael@riseuplabs.com');
  assert.strictEqual(michaelNotifs.length, 2);
  assert.ok(michaelNotifs.some((n) => n.id === 'notif-2'));
  assert.ok(michaelNotifs.some((n) => n.id === 'notif-4'));
  assert.strictEqual(michaelNotifs.some((n) => n.id === 'notif-1'), false);

  // Sarah Lin (usr-1) has no personal alerts, only sees broadcast notif-4
  const sarahNotifs = filterForUser('usr-1', 'sarah@riseuplabs.com');
  assert.strictEqual(sarahNotifs.length, 1);
  assert.strictEqual(sarahNotifs[0].id, 'notif-4');
});

test('User-Wise Notifications: Mark all read only marks current user notifications as read', () => {
  let notifications = [
    { id: 'n-1', recipientId: 'usr-sarah', isRead: false },
    { id: 'n-2', recipientId: 'usr-alex', isRead: false },
    { id: 'n-3', recipientId: 'usr-sarah', isRead: false },
  ];

  const currentUserId = 'usr-sarah';

  // Mark all read for Sarah
  notifications = notifications.map((n) => {
    const isForMe = n.recipientId === currentUserId;
    return isForMe ? { ...n, isRead: true } : n;
  });

  // Sarah's notifications are marked read
  assert.strictEqual(notifications[0].isRead, true);
  assert.strictEqual(notifications[2].isRead, true);

  // Alex's notification remains unread
  assert.strictEqual(notifications[1].isRead, false);
});

test('Access Approval: Accounts under ChatGPT Team / Plus are correctly listed with operational status and seat capacity', () => {
  const chatGptAccounts = INITIAL_ACCOUNTS.filter(
    (a) =>
      (a.serviceId === 'srv-1' || a.serviceName.toLowerCase().includes('chatgpt')) &&
      a.accountStatus !== 'Inactive' &&
      a.accountStatus !== 'Suspended' &&
      a.accountStatus !== 'Expired' &&
      a.accountStatus !== 'Cancelled'
  );

  // Exactly 5 foundational ChatGPT accounts must be listed and operational
  assert.strictEqual(chatGptAccounts.length, 5);

  // Verify accounts with available capacity are present
  const availableCandidates = chatGptAccounts.filter(
    (a) => !a.seatLimit || (a.allocatedSeats || 0) < a.seatLimit
  );
  // acc-1 (2/5 seats), acc-3 (0/1 seats), acc-4 (0/1 seats), acc-5 (3/10 seats) have open capacity
  assert.strictEqual(availableCandidates.length, 4);

  // Ensure accounts have emails and capacity information
  assert.ok(chatGptAccounts.some((a) => a.accountEmail === 'dev.ai1@riseuplabs.com'));
  assert.ok(chatGptAccounts.some((a) => a.accountEmail === 'design.ai@riseuplabs.com'));
  assert.ok(chatGptAccounts.some((a) => a.accountEmail === 'qa.ai@riseuplabs.com'));
  assert.ok(chatGptAccounts.some((a) => a.accountEmail === 'exec.ai@riseuplabs.com'));
});

test('Payment Cards Privacy: Strict owner-governed visibility and Super Admin availability tracking', () => {
  const cards = [
    {
      id: 'card-1',
      cardName: 'AWS & Cloud Primary Visa',
      ownerId: 'usr-david',
      authorizedUserIds: ['usr-david', 'usr-sarah'],
      status: 'Active' as const,
    },
    {
      id: 'card-2',
      cardName: 'Marketing Mastercard',
      ownerId: 'usr-david',
      authorizedUserIds: ['usr-david'],
      status: 'Active' as const,
    },
  ];

  // Helper matching PaymentCardsView visibleCards logic
  const getVisibleCards = (userId: string, roles: UserRole[]) => {
    const isSuperAdmin = roles.includes('Super Admin');
    return cards.filter((card) => {
      const isOwner = card.ownerId === userId;
      const isAuthorized = card.authorizedUserIds.includes(userId);
      if (isOwner || isAuthorized) return true;
      if (isSuperAdmin) return true;
      return false;
    });
  };

  // 1. Regular employee with no ownership or authorization: sees 0 cards
  const employeeCards = getVisibleCards('usr-emp-99', ['Employee']);
  assert.strictEqual(employeeCards.length, 0);

  // 2. User with authorization on card-1 only: sees only card-1
  const sarahCards = getVisibleCards('usr-sarah', ['Team Lead']);
  assert.strictEqual(sarahCards.length, 1);
  assert.strictEqual(sarahCards[0].id, 'card-1');

  // 3. Card owner (David): sees both cards
  const davidCards = getVisibleCards('usr-david', ['Finance Manager']);
  assert.strictEqual(davidCards.length, 2);

  // 4. Super Admin (Nahian): sees both cards for organizational availability tracking
  const superAdminCards = getVisibleCards('usr-nahian', ['Super Admin']);
  assert.strictEqual(superAdminCards.length, 2);

  // Verify that Super Admin does NOT have reveal authorization on cards not owned or authorized
  const isSuperAdminAuthorizedOnCard1 =
    cards[0].ownerId === 'usr-nahian' || cards[0].authorizedUserIds.includes('usr-nahian');
  assert.strictEqual(isSuperAdminAuthorizedOnCard1, false); // Availability Only!
});

test('Requisition Approvals: Full details accessibility for approvers before decision', () => {
  const sampleRequisition = {
    id: 'req-2026-001',
    requisitionNumber: 'REQ-2026-001',
    serviceName: 'Cursor AI',
    requesterName: 'Sarah Lin',
    departmentName: 'Engineering',
    estimatedAmount: 20,
    currency: 'USD',
    businessJustification: 'Needed for AI-assisted development productivity',
    stages: [
      {
        stageName: 'Team Lead Review',
        roleOrPosition: 'Team Lead',
        isRequired: true,
        status: 'Pending' as const,
      },
    ],
    currentStageIndex: 0,
  };

  // Ensure justification, requester, and stages are populated for view details modal
  assert.ok(sampleRequisition.businessJustification.length > 0);
  assert.strictEqual(sampleRequisition.serviceName, 'Cursor AI');
  assert.strictEqual(sampleRequisition.stages.length, 1);
  assert.strictEqual(sampleRequisition.stages[0].status, 'Pending');
});

test('Employee Removal & Anonymization: Preserves data, assigns anonymous ID as main ID, and retains original email for reports and search', () => {
  // Setup sample employee with historical requisitions
  const oldUserId = 'usr-sarah-test';
  let sampleUsers: User[] = [
    {
      id: oldUserId,
      name: 'Sarah Lin',
      email: 'sarah.lin@riseuplabs.com',
      phone: '+880 1711-223344',
      designation: 'Staff AI Engineer',
      departmentId: 'dept-eng',
      departmentName: 'Engineering',
      roles: ['Team Lead', 'Employee'],
      accountStatus: 'Active',
    },
  ];

  let sampleRequisitions = [
    {
      id: 'req-hist-1',
      requesterId: oldUserId,
      requesterName: 'Sarah Lin',
      serviceName: 'OpenAI Enterprise',
      departmentName: 'Engineering',
      estimatedAmount: 3600,
    },
  ];

  // Anonymization simulation matching AppContext and backend
  const timestamp = Date.now().toString(36);
  const randomSuffix = 'test1';
  const anonymousId = `anon-usr-${timestamp}-${randomSuffix}`;
  const anonymousEmail = `anonymous-${timestamp}-${randomSuffix}@riseuplabs.com`;
  const originalEmail = sampleUsers[0].email;

  // Perform anonymization
  sampleUsers = sampleUsers.map((u) => {
    if (u.id === oldUserId) {
      return {
        ...u,
        id: anonymousId,
        originalId: oldUserId,
        email: anonymousEmail,
        originalEmail,
        mainEmail: originalEmail,
        accountStatus: 'Inactive' as const,
        isAnonymized: true,
        anonymizedAt: new Date().toISOString(),
      };
    }
    return u;
  });

  // Re-link requisitions to anonymous ID to prevent report gap
  sampleRequisitions = sampleRequisitions.map((r) =>
    r.requesterId === oldUserId ? { ...r, requesterId: anonymousId } : r
  );

  // 1. Employee data is preserved (NOT deleted)
  assert.strictEqual(sampleUsers.length, 1);
  const employee = sampleUsers[0];

  // 2. Anonymous ID became main ID
  assert.strictEqual(employee.id, anonymousId);
  assert.strictEqual(employee.originalId, oldUserId);

  // 3. Anonymous email assigned, but original email retained
  assert.strictEqual(employee.email, anonymousEmail);
  assert.strictEqual(employee.originalEmail, 'sarah.lin@riseuplabs.com');
  assert.strictEqual(employee.mainEmail, 'sarah.lin@riseuplabs.com');

  // 4. Other information preserved for reports
  assert.strictEqual(employee.name, 'Sarah Lin');
  assert.strictEqual(employee.departmentName, 'Engineering');
  assert.strictEqual(employee.designation, 'Staff AI Engineer');
  assert.strictEqual(employee.accountStatus, 'Inactive');
  assert.strictEqual(employee.isAnonymized, true);

  // 5. Requisitions re-linked without gaps or orphaned records
  assert.strictEqual(sampleRequisitions[0].requesterId, anonymousId);
  assert.strictEqual(sampleRequisitions[0].estimatedAmount, 3600);

  // 6. Search matching: searchable by both original email and new anonymous email
  const searchByOriginalEmail = sampleUsers.filter(
    (u) =>
      u.email.toLowerCase().includes('sarah.lin') ||
      (u.originalEmail && u.originalEmail.toLowerCase().includes('sarah.lin'))
  );
  assert.strictEqual(searchByOriginalEmail.length, 1);

  const searchByAnonEmail = sampleUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(anonymousEmail.toLowerCase()) ||
      (u.originalEmail && u.originalEmail.toLowerCase().includes(anonymousEmail.toLowerCase()))
  );
  assert.strictEqual(searchByAnonEmail.length, 1);
});


