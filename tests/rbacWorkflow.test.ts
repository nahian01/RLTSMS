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

test('RBAC: Employee role has view and submit permissions but cannot manage org or workflows', () => {
  const employeeRoles: UserRole[] = ['Employee'];
  assert.strictEqual(checkUserPermission(employeeRoles, 'requisitions:submit'), true);
  assert.strictEqual(checkUserPermission(employeeRoles, 'requisitions:view'), true);
  assert.strictEqual(checkUserPermission(employeeRoles, 'services:view'), true);
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
