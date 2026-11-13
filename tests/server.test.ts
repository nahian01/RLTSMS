import test from 'node:test';
import assert from 'node:assert/strict';
import app, { startServer } from '../server/index';
import { dbStore, verifyPassword, hashPassword } from '../server/data/store';
import http from 'http';

let server: http.Server;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper to make JSON requests to the test server
async function apiRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

test('Setup RLTSMS Test Server', async () => {
  dbStore.reset();
  server = await startServer(TEST_PORT);
  assert.ok(server, 'Server should start successfully');
});

test('API Health Check Endpoint returns 200 and enterprise identity', async () => {
  const { status, data } = await apiRequest('/api/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.system, 'RLTSMS Enterprise API');
  assert.strictEqual(data.organization, 'Riseup Labs');
});

test('Authentication: Login with valid credentials succeeds and logs audit event', async () => {
  const { status, data } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'wasiur@riseuplabs.com', password: 'RiseupLabs@2026' },
  });
  assert.strictEqual(status, 200);
  assert.ok(data.token, 'Must return session token');
  assert.strictEqual(data.user.email, 'wasiur@riseuplabs.com');
  assert.strictEqual(data.user.passwordHash, undefined, 'Password hash must never be returned to client');

  // Verify audit event
  const state = dbStore.getState();
  const loginAudit = state.auditLogs.find((a) => a.action === 'User Login' && a.userId === 'usr-4');
  assert.ok(loginAudit, 'Must record user login event in audit ledger');
});

test('Authentication: Login with invalid password fails and is recorded in audit ledger', async () => {
  const { status, data } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'wasiur@riseuplabs.com', password: 'WrongPassword123' },
  });
  assert.strictEqual(status, 401);
  assert.ok(data.error.includes('Invalid credentials'));

  const state = dbStore.getState();
  const failedAudit = state.auditLogs.find((a) => a.action === 'Failed Login Attempt' && a.userId === 'usr-4');
  assert.ok(failedAudit, 'Must record failed login attempt in audit ledger');
});

test('Mandatory Card Security: Card owner can reveal card after password verification', async () => {
  // card-1 owner is Wasiur Rahman (usr-4)
  const { status, data } = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-4' },
    body: { password: 'RiseupLabs@2026' },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.revealed.lastFour, '8492');
  assert.strictEqual(data.revealed.cardName, 'AWS & Cloud Primary Visa');
  assert.strictEqual(data.autoMaskInSeconds, 30, 'Auto-masking window must be 30 seconds');

  // Verify successful reveal audit log
  const state = dbStore.getState();
  const revealLog = state.cardRevealLogs.find(
    (l) => l.cardId === 'card-1' && l.viewerId === 'usr-4' && l.action === 'reveal_masked'
  );
  assert.ok(revealLog, 'Must record successful reveal in card reveal audit ledger');
  assert.strictEqual(revealLog.result, 'Success');
});

test('Mandatory Card Security: Card reveal without password verification is denied', async () => {
  const { status, data } = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-4' },
    body: { password: '' }, // No password
  });

  assert.strictEqual(status, 400);
  assert.ok(data.error.includes('password is required'));
});

test('Mandatory Card Security: Invalid password verification is rejected and logged', async () => {
  const { status, data } = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-4' },
    body: { password: 'WrongPasswordXYZ' },
  });

  assert.strictEqual(status, 401);
  assert.ok(data.error.includes('Incorrect account password'));

  const state = dbStore.getState();
  const failedLog = state.cardRevealLogs.find(
    (l) => l.cardId === 'card-1' && l.viewerId === 'usr-4' && l.action === 'failed_password'
  );
  assert.ok(failedLog, 'Must record failed password attempt in card reveal logs');
  assert.strictEqual(failedLog.result, 'Denied');
});

test('Mandatory Card Security: Super Admin does NOT automatically bypass owner visibility restrictions', async () => {
  // usr-admin is Super Admin, but card-1 owner is Wasiur Rahman (usr-4).
  // Admin is not in authorizedUserIds of card-1 unless granted by owner!
  const { status, data } = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: { password: 'RiseupLabs@2026' },
  });

  assert.strictEqual(status, 403, 'Super Admin without owner permission must be denied (403)');
  assert.ok(data.error.includes('Access Denied'));

  const state = dbStore.getState();
  const unauthLog = state.cardRevealLogs.find(
    (l) => l.cardId === 'card-1' && l.viewerId === 'usr-admin' && l.action === 'unauthorized_attempt'
  );
  assert.ok(unauthLog, 'Must record unauthorized reveal attempt in audit ledger');
  assert.strictEqual(unauthLog.result, 'Denied');
});

test('Mandatory Card Security: Card owner can grant visibility and authorized user can then reveal', async () => {
  // 1. Wasiur Rahman (usr-4) grants visibility on card-1 to Sarah Lin (usr-1)
  const grantRes = await apiRequest('/api/cards/card-1/visibility', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-4' },
    body: { targetUserId: 'usr-1', action: 'grant' },
  });
  assert.strictEqual(grantRes.status, 200);
  assert.ok(grantRes.data.authorizedUserIds.includes('usr-1'));

  // 2. Sarah Lin reveals card-1 using her own password
  const revealRes = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-1' },
    body: { password: 'RiseupLabs@2026' },
  });
  assert.strictEqual(revealRes.status, 200);
  assert.strictEqual(revealRes.data.revealed.lastFour, '8492');

  // 3. Sarah Lin cannot reveal card-3 (owned by Kazi Fahim usr-5)
  const card3Res = await apiRequest('/api/cards/card-3/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-1' },
    body: { password: 'RiseupLabs@2026' },
  });
  assert.strictEqual(card3Res.status, 403, 'Password verification does not unlock other cards');

  // 4. Wasiur Rahman revokes visibility from Sarah Lin
  const revokeRes = await apiRequest('/api/cards/card-1/visibility', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-4' },
    body: { targetUserId: 'usr-1', action: 'revoke' },
  });
  assert.strictEqual(revokeRes.status, 200);
  assert.ok(!revokeRes.data.authorizedUserIds.includes('usr-1'));

  // 5. Subsequent reveal by Sarah Lin is immediately rejected
  const revealAfterRevoke = await apiRequest('/api/cards/card-1/reveal', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-1' },
    body: { password: 'RiseupLabs@2026' },
  });
  assert.strictEqual(revealAfterRevoke.status, 403, 'Revoked permissions immediately prevent future reveals');
});

test('Mandatory Card Security: Non-owner cannot grant visibility to others', async () => {
  // Sarah Lin (usr-1) tries to grant access to card-1 (owned by Wasiur Rahman)
  const { status, data } = await apiRequest('/api/cards/card-1/visibility', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-1' },
    body: { targetUserId: 'usr-5', action: 'grant' },
  });
  assert.strictEqual(status, 403);
  assert.ok(data.error.includes('Only the registered card owner'));
});

test('Mandatory Access Sharing: Zero-Credential assignment creation, extension and revocation', async () => {
  // 1. Create access assignment for Sarah Lin on ChatGPT Plus
  const createRes = await apiRequest('/api/access/assignments', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: {
      serviceId: 'srv-1',
      accountId: 'acc-1',
      recipientType: 'employee',
      recipientId: 'usr-1',
      startDate: '2026-11-15',
      expirationDate: '2026-12-15',
      permissionLevel: 'user',
      notes: 'Testing zero-credential assignment',
    },
  });

  assert.strictEqual(createRes.status, 201);
  const assignment = createRes.data;
  assert.strictEqual(assignment.status, 'Active');
  assert.strictEqual(assignment.recipientId, 'usr-1');
  assert.strictEqual(assignment.recipientName, 'Sarah Lin');

  // Verify that zero credentials (password, recovery email) exist in the assignment
  assert.strictEqual((assignment as any).password, undefined, 'Must not store service password');
  assert.strictEqual((assignment as any).recoveryCode, undefined, 'Must not store recovery code');

  // 2. Extend access assignment
  const extendRes = await apiRequest(`/api/access/assignments/${assignment.id}/extend`, {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: { newExpirationDate: '2027-01-15' },
  });
  assert.strictEqual(extendRes.status, 200);

  // 3. Revoke access assignment
  const revokeRes = await apiRequest(`/api/access/assignments/${assignment.id}/revoke`, {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: { reason: 'Project completed' },
  });
  assert.strictEqual(revokeRes.status, 200);

  // Verify status is Revoked
  const listRes = await apiRequest('/api/access/assignments');
  const found = listRes.data.find((a: any) => a.id === assignment.id);
  assert.strictEqual(found.status, 'Revoked');
});

test('Email Templates Management: Template listing, rendering and test dispatch', async () => {
  // 1. List email templates (8 expected)
  const listRes = await apiRequest('/api/email/templates');
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listRes.data.length, 8, 'Must have 8 official Riseup Labs email templates');

  // 2. Preview OTP template
  const otpTpl = listRes.data.find((t: any) => t.key === 'otp_verification');
  assert.ok(otpTpl);

  const previewRes = await apiRequest('/api/email/preview', {
    method: 'POST',
    body: {
      templateId: otpTpl.id,
      variables: {
        '{{recipient_name}}': 'Nadia Hossain',
        '{{otp_code}}': '918273',
        '{{expiry_time}}': '10 minutes',
      },
    },
  });
  assert.strictEqual(previewRes.status, 200);
  assert.ok(previewRes.data.subject.includes('918273'));
  assert.ok(previewRes.data.bodyHtml.includes('Nadia Hossain'));
  assert.ok(previewRes.data.bodyHtml.includes('Riseup Labs'));

  // 3. Test send
  const sendRes = await apiRequest('/api/email/test-send', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: { templateId: otpTpl.id, recipientEmail: 'test-admin@riseuplabs.com' },
  });
  assert.strictEqual(sendRes.status, 200);
  assert.strictEqual(sendRes.data.success, true);
  assert.strictEqual(sendRes.data.deliveryLog.status, 'Sent');
});

test('Reports & Financials: Summary calculation and sanitized CSV export', async () => {
  const sumRes = await apiRequest('/api/reports/summary');
  assert.strictEqual(sumRes.status, 200);
  assert.ok(typeof sumRes.data.totalActualSpend === 'number');
  assert.ok(typeof sumRes.data.totalVariance === 'number');

  // Verify sanitized CSV export
  const csvRes = await fetch(`${BASE_URL}/api/reports/export/csv`);
  assert.strictEqual(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Purchase ID'));
  assert.ok(!csvText.includes('•••• •••• •••• 8492')); // Must never expose full card digits
});

test('Initial Database Setup: Exactly five foundational accounts and zero fake demo users', async () => {
  const res = await apiRequest('/api/org/users');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.length, 5, 'Must contain exactly 5 initial production setup accounts');

  const emails = res.data.map((u: any) => u.email);
  assert.ok(emails.includes('nahian@riseuplabs.com'), 'Super Admin account must exist');
  assert.ok(emails.includes('wasiur@riseuplabs.com'), 'Operations Manager account must exist');
  assert.ok(emails.includes('tariq.ahmed@riseuplabs.com'), 'Department Lead account must exist');
  assert.ok(emails.includes('kazi.fahim@riseuplabs.com'), 'Purchaser account must exist');
  assert.ok(emails.includes('sarah.lin@riseuplabs.com'), 'Employee account must exist');
});

test('Role & Permissions Setup: All 10 RLTSMS system roles are defined in store', async () => {
  const res = await apiRequest('/api/org/roles');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.length, 10, 'All 10 required system roles must be initialized');

  const roleNames = res.data.map((r: any) => r.name);
  assert.ok(roleNames.includes('Super Admin'));
  assert.ok(roleNames.includes('System Admin'));
  assert.ok(roleNames.includes('Employee'));
  assert.ok(roleNames.includes('Team Lead'));
  assert.ok(roleNames.includes('Department Lead'));
  assert.ok(roleNames.includes('Operation Manager'));
  assert.ok(roleNames.includes('Purchaser'));
  assert.ok(roleNames.includes('Finance'));
  assert.ok(roleNames.includes('Management'));
  assert.ok(roleNames.includes('Card Information Viewer'));
});

test('Predefined Access Reasons: Super Admin CRUD operations', async () => {
  // 1. List predefined reasons
  const listRes = await apiRequest('/api/access/reasons');
  assert.strictEqual(listRes.status, 200);
  assert.ok(listRes.data.length >= 10, 'Must have predefined reasons seeded');

  // 2. Create custom reason
  const createRes = await apiRequest('/api/access/reasons', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: {
      name: 'Security Vulnerability Patching',
      description: 'Dedicated access for urgent CVE remediation sprint',
      displayOrder: 20,
    },
  });
  assert.strictEqual(createRes.status, 201);
  const createdReason = createRes.data;
  assert.strictEqual(createdReason.name, 'Security Vulnerability Patching');

  // 3. Update reason
  const updateRes = await apiRequest(`/api/access/reasons/${createdReason.id}`, {
    method: 'PUT',
    headers: { 'x-user-id': 'usr-admin' },
    body: {
      name: 'Security Vulnerability Patching (High Priority)',
      displayOrder: 2,
    },
  });
  assert.strictEqual(updateRes.status, 200);

  // 4. Archive reason (safe archive without deleting historical references)
  const deleteRes = await apiRequest(`/api/access/reasons/${createdReason.id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': 'usr-admin' },
  });
  assert.strictEqual(deleteRes.status, 200);
});

test('Employee Access Request & Streamlined 1-Click Approve and Assign Flow', async () => {
  // 1. Kazi Fahim submits access request for ChatGPT Team
  const reqRes = await apiRequest('/api/access/requests', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-5' },
    body: {
      serviceId: 'srv-1',
      requestedAccessType: 'Shared Team Seat',
      reasonId: 'rsn-1',
      reason: 'Project Requirement',
      additionalExplanation: 'Procurement portal integration AI prompt verification',
      duration: 'Project-based (3 Months)',
    },
  });
  assert.strictEqual(reqRes.status, 201);
  const accessReq = reqRes.data;
  assert.strictEqual(accessReq.status, 'Pending');
  assert.strictEqual(accessReq.requesterId, 'usr-5');

  // 2. Admin executes 1-click Approve & Assign on acc-1
  const approveRes = await apiRequest(`/api/access/requests/${accessReq.id}/approve-and-assign`, {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: {
      accountId: 'acc-1',
      startDate: '2026-11-15',
      expirationDate: '2027-02-15',
      permissionLevel: 'user',
      notes: '1-click approval authorized by Super Admin',
    },
  });

  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.success, true);
  assert.strictEqual(approveRes.data.assignment.status, 'Active');

  // 3. Verify request is now marked Fulfilled
  const checkReq = await apiRequest(`/api/access/requests/${accessReq.id}`);
  assert.strictEqual(checkReq.status, 200);
  assert.strictEqual(checkReq.data.status, 'Fulfilled');
  assert.strictEqual(checkReq.data.assignedAccountId, 'acc-1');

  // 4. Verify historical record was created in account_access_history
  const histRes = await apiRequest(`/api/access/assignments/${approveRes.data.assignment.id}/history`);
  assert.strictEqual(histRes.status, 200);
  assert.ok(histRes.data.length >= 1);
  assert.strictEqual(histRes.data[0].action, 'grant');
});

test('Centralized Sharing Hub: Hierarchical 3-Tier Endpoints and Upcoming Events', async () => {
  // Tier 1: Master services overview with sharing metrics
  const tier1Res = await apiRequest('/api/access/sharing/services');
  assert.strictEqual(tier1Res.status, 200);
  assert.ok(Array.isArray(tier1Res.data));
  assert.ok(tier1Res.data.length > 0);
  const svc0 = tier1Res.data[0];
  assert.ok('totalAccounts' in svc0);
  assert.ok('activeAccounts' in svc0);
  assert.ok('allocationStatus' in svc0);

  // Tier 2: Accounts under specific service
  const tier2Res = await apiRequest(`/api/access/sharing/services/${svc0.id}/accounts`);
  assert.strictEqual(tier2Res.status, 200);
  assert.ok(Array.isArray(tier2Res.data));

  // Tier 3: Assignments under specific account
  const tier3Res = await apiRequest('/api/access/sharing/accounts/acc-1/assignments');
  assert.strictEqual(tier3Res.status, 200);
  assert.ok(Array.isArray(tier3Res.data.assignments));
  assert.ok('account' in tier3Res.data);

  // Upcoming Events Monitor (distinguishing subscriptions vs access grants)
  const eventsRes = await apiRequest('/api/access/upcoming-events?timeframe=30');
  assert.strictEqual(eventsRes.status, 200);
  assert.ok(Array.isArray(eventsRes.data));
  eventsRes.data.forEach((evt: any) => {
    assert.ok(
      evt.type === 'Subscription Renewal' || evt.type === 'Access Expiration',
      'Event must clearly distinguish Subscription vs Access Expiration'
    );
  });
});

test('Employee Management: Add User, Invitation Token & Status Toggle', async () => {
  // 1. Add employee with department, team, reporting lead and roles
  const addRes = await apiRequest('/api/org/users', {
    method: 'POST',
    headers: { 'x-user-id': 'usr-admin' },
    body: {
      name: 'Nafis Sadik',
      email: 'nafis.sadik@riseuplabs.com',
      phone: '+880 1711-223344',
      designation: 'Senior DevOps Engineer',
      departmentId: 'dept-eng',
      teamId: 'team-mobile',
      reportingLeadId: 'usr-3',
      roles: ['Employee', 'Team Lead'],
    },
  });

  assert.strictEqual(addRes.status, 201, 'Adding new employee must succeed');
  assert.strictEqual(addRes.data.name, 'Nafis Sadik');
  assert.strictEqual(addRes.data.accountStatus, 'Pending Invitation');
  assert.ok(addRes.data.invitationExpiresAt, 'Must set 48h activation expiry');

  const newEmpId = addRes.data.id;

  // 2. Toggle status to Active
  const activateRes = await apiRequest(`/api/org/users/${newEmpId}/status`, {
    method: 'PATCH',
    headers: { 'x-user-id': 'usr-admin' },
    body: { status: 'Active' },
  });
  assert.strictEqual(activateRes.status, 200);

  // Verify status in store
  const state = dbStore.getState();
  const emp = state.users.find((u) => u.id === newEmpId);
  assert.strictEqual(emp?.accountStatus, 'Active');

  // 3. Toggle status to Inactive
  const deactivateRes = await apiRequest(`/api/org/users/${newEmpId}/status`, {
    method: 'PATCH',
    headers: { 'x-user-id': 'usr-admin' },
    body: { status: 'Inactive' },
  });
  assert.strictEqual(deactivateRes.status, 200);
  const emp2 = dbStore.getState().users.find((u) => u.id === newEmpId);
  assert.strictEqual(emp2?.accountStatus, 'Inactive');
});

test('Teardown RLTSMS Test Server', async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  assert.ok(true, 'Server closed cleanly');
});
