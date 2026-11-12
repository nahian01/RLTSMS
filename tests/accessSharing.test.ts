import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SERVICES, INITIAL_ACCOUNTS, INITIAL_WORKFLOWS, INITIAL_ACCESS_REQUESTS } from '../src/data/mockData';
import { AccessRequest, ServiceAccount } from '../src/types';

test('Access Sharing Workflow exists and has correct purpose', () => {
  const accessWf = INITIAL_WORKFLOWS.find((w) => w.purpose === 'Access-sharing requests');
  assert.ok(accessWf, 'Access sharing workflow should exist');
  assert.strictEqual(accessWf.isActive, true);
  assert.strictEqual(accessWf.stages.length, 2);
  assert.strictEqual(accessWf.stages[0].roleName, 'Team Lead');
  assert.strictEqual(accessWf.stages[1].roleName, 'Department Lead');
});

test('Initial access requests include pending and approved samples', () => {
  assert.ok(INITIAL_ACCESS_REQUESTS.length >= 2);
  const pending = INITIAL_ACCESS_REQUESTS.find((r) => r.status === 'Pending Approval');
  assert.ok(pending, 'Should have pending access request');
  assert.ok(pending.serviceName.includes('ChatGPT'));

  const approved = INITIAL_ACCESS_REQUESTS.find((r) => r.status === 'Approved');
  assert.ok(approved, 'Should have approved access request with assigned account');
  assert.ok(approved.assignedAccountEmail, 'Approved request must record assigned account email');
});

test('Approver account assignment logic simulates shared seat provisioning', () => {
  const account: ServiceAccount = {
    id: 'acc-test-1',
    serviceId: 'srv-chatgpt',
    serviceName: 'ChatGPT Plus',
    accountEmail: 'dev.ai1@riseuplabs.com',
    planName: 'Team / 5 Seats',
    purchaseDate: '2026-01-15',
    purchaseAmount: 30,
    currency: 'USD',
    billingCycle: 'Monthly',
    purchaseSource: 'Direct',
    accountStatus: 'Active',
    paymentStatus: 'Paid',
    sharedUserIds: ['usr-sarah'],
    sharedUserNames: ['Sarah Lin'],
  };

  const requesterId = 'usr-alex';
  const requesterName = 'Alex Rivera';

  // Simulating approval action
  const updatedUserIds = account.sharedUserIds?.includes(requesterId)
    ? account.sharedUserIds
    : [...(account.sharedUserIds || []), requesterId];
  const updatedUserNames = account.sharedUserNames?.includes(requesterName)
    ? account.sharedUserNames
    : [...(account.sharedUserNames || []), requesterName];

  const updatedAccount = {
    ...account,
    sharedUserIds: updatedUserIds,
    sharedUserNames: updatedUserNames,
  };

  assert.strictEqual(updatedAccount.sharedUserIds.length, 2);
  assert.ok(updatedAccount.sharedUserIds.includes('usr-alex'));
  assert.ok(updatedAccount.sharedUserNames.includes('Alex Rivera'));
});
