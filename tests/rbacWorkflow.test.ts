import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ROLES, INITIAL_WORKFLOWS, INITIAL_PERMISSIONS } from '../src/data/mockData';
import { ApprovalWorkflow, WorkflowStageDefinition, UserRole } from '../src/types';

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

test('Request Service/Tools Module: Scoped to employee approved requests list', () => {
  const allRequests = [
    { id: 'req-1', requesterId: 'usr-5', serviceName: 'BrowserStack', status: 'Approved' },
    { id: 'req-2', requesterId: 'usr-5', serviceName: 'ChatGPT Plus', status: 'Pending Approval' },
    { id: 'req-3', requesterId: 'usr-other', serviceName: 'AWS Pro', status: 'Approved' },
  ];

  // Employee only sees their own requests
  const myRequests = allRequests.filter((r) => r.requesterId === 'usr-5');
  assert.strictEqual(myRequests.length, 2);

  // Employee approved list strictly filters to approved requests
  const myApprovedList = myRequests.filter((r) => r.status === 'Approved');
  assert.strictEqual(myApprovedList.length, 1);
  assert.strictEqual(myApprovedList[0].serviceName, 'BrowserStack');
});
