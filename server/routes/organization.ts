import { Router, Request, Response } from 'express';
import { dbStore, hashPassword } from '../data/store';
import { Department, Team, User, RoleDefinition, PermissionDefinition, UserRole } from '../../src/types';

export const orgRouter = Router();

// GET /api/org/users
orgRouter.get('/users', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  const safeUsers = state.users.map(({ passwordHash, ...u }) => u);
  return res.json(safeUsers);
});

// GET /api/org/roles - List system roles and definitions (Part 2.1)
orgRouter.get('/roles', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.roles || []);
});

// POST /api/org/users - Add employee later (Part 2.2)
orgRouter.post('/users', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const {
    name,
    email,
    phone,
    designation,
    departmentId,
    teamId,
    reportingLeadId,
    roles = ['Employee'],
  } = req.body;

  if (!name || !email || !designation || !departmentId) {
    return res.status(400).json({ error: 'Name, email, designation, and departmentId are required.' });
  }

  const state = dbStore.getState();
  const existing = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'A user with this email address already exists.' });
  }

  const dept = state.departments.find((d) => d.id === departmentId);
  const team = teamId ? state.teams.find((t) => t.id === teamId) : undefined;
  const lead = reportingLeadId ? state.users.find((u) => u.id === reportingLeadId) : undefined;
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '+880 1700-000000',
    designation: designation.trim(),
    departmentId,
    departmentName: dept ? dept.name : 'Engineering',
    teamId,
    teamName: team ? team.name : undefined,
    reportingLeadId: lead ? lead.id : undefined,
    reportingLeadName: lead ? lead.name : undefined,
    roles,
    accountStatus: 'Pending Invitation',
    invitationSentAt: new Date().toISOString(),
    invitationExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    cardPermissionLevel: 'none',
  };

  const tempPass = hashPassword('RiseupLabs@2026');

  dbStore.mutate((s) => {
    s.users.push({ ...newUser, passwordHash: tempPass });

    // Log invitation email dispatch with 48h activation link
    s.emailLogs.unshift({
      id: `elog-${Date.now()}`,
      templateKey: 'employee_invitation',
      templateName: 'Employee Workspace Invitation',
      recipientEmail: newUser.email,
      recipientName: newUser.name,
      subject: `Welcome to RLTSMS – Activate your Riseup Labs account`,
      status: 'Sent',
      attemptCount: 1,
      dispatchedAt: new Date().toISOString(),
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Add Employee Account',
      entity: 'Organization',
      entityId: newUser.id,
      details: `Added new employee ${newUser.name} (${newUser.email}) to ${newUser.departmentName}. Reporting to ${lead?.name || 'Department Head'}.`,
    });
  });

  return res.status(201).json(newUser);
});

// PATCH /api/org/users/:id/status - Activate or deactivate employee account (Part 2.2)
orgRouter.patch('/users/:id/status', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be either Active or Inactive.' });
  }

  const state = dbStore.getState();
  const targetUser = state.users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    const u = s.users.find((x) => x.id === id);
    if (u) {
      u.accountStatus = status;
    }
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: status === 'Active' ? 'Activate Account' : 'Deactivate Account',
      entity: 'User',
      entityId: id,
      details: `${status === 'Active' ? 'Activated' : 'Deactivated'} account for ${targetUser.name} (${targetUser.email}).`,
    });
  });

  return res.json({ success: true, message: `Account status updated to ${status}.` });
});

// PUT /api/org/setup-five-users - Initial setup configuration for foundational 5 accounts (Part 2)
orgRouter.put('/setup-five-users', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { initialUsers } = req.body;

  if (!Array.isArray(initialUsers) || initialUsers.length !== 5) {
    return res.status(400).json({ error: 'Exactly five initial user accounts must be provided for initial system setup.' });
  }

  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    // Preserve existing password hashes if matching
    const updatedUsers = initialUsers.map((u: User) => {
      const prev = s.users.find((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase());
      return {
        ...u,
        passwordHash: prev ? prev.passwordHash : hashPassword('RiseupLabs@2026'),
      };
    });

    s.users = updatedUsers;

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Configure Initial Five Accounts',
      entity: 'Organization',
      entityId: 'init-setup',
      details: 'Configured the foundational five initial production accounts for Riseup Labs operational setup.',
    });
  });

  return res.json({ success: true, message: 'Five initial accounts configured successfully.' });
});

// ============================================================================
// DYNAMIC RBAC: ROLES MANAGEMENT
// ============================================================================

// GET /api/org/roles - List all roles with assigned permissions
orgRouter.get('/roles', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.roles || []);
});

// POST /api/org/roles - Create new dynamic role
orgRouter.post('/roles', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, description = '', permissions = [] } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  const trimmedName = name.trim();
  const state = dbStore.getState();
  const exists = state.roles.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: `A role named "${trimmedName}" already exists.` });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const newRole: RoleDefinition = {
    id: `role-${Date.now()}`,
    name: trimmedName as UserRole,
    description: description.trim(),
    isSystem: false,
    permissions: Array.isArray(permissions) ? permissions : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.roles.push(newRole);
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Create Dynamic Role',
      entity: 'RBAC',
      entityId: newRole.id,
      details: `Created new custom role "${newRole.name}" with ${newRole.permissions.length} initial permissions.`,
    });
  });

  return res.status(201).json(newRole);
});

// PUT /api/org/roles/:id - Update dynamic or system role (permissions & description)
orgRouter.put('/roles/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  const state = dbStore.getState();
  const roleIndex = state.roles.findIndex((r) => r.id === id);
  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found.' });
  }

  const targetRole = state.roles[roleIndex];
  const oldName = targetRole.name;
  let newName = oldName;

  // If renaming, check uniqueness
  if (name && typeof name === 'string' && name.trim() && name.trim() !== oldName) {
    if (targetRole.isSystem && targetRole.name === 'Super Admin') {
      return res.status(400).json({ error: 'System root role name cannot be modified.' });
    }
    const collision = state.roles.some((r) => r.id !== id && r.name.toLowerCase() === name.trim().toLowerCase());
    if (collision) {
      return res.status(409).json({ error: `A role named "${name.trim()}" already exists.` });
    }
    newName = name.trim() as UserRole;
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    const r = s.roles.find((x) => x.id === id);
    if (!r) return;

    if (newName !== oldName) {
      r.name = newName;
      // Cascade renamed role name across existing users
      s.users.forEach((u) => {
        u.roles = u.roles.map((rn) => (rn === oldName ? newName : rn));
      });
    }

    if (typeof description === 'string') {
      r.description = description.trim();
    }

    if (Array.isArray(permissions)) {
      r.permissions = permissions;
    }

    r.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Update Role Permissions',
      entity: 'RBAC',
      entityId: id,
      details: `Updated role "${r.name}". Permissions now assigned: ${r.permissions.length} items.`,
    });
  });

  const updated = dbStore.getState().roles.find((r) => r.id === id);
  return res.json(updated);
});

// DELETE /api/org/roles/:id - Delete dynamic role
orgRouter.delete('/roles/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;

  const state = dbStore.getState();
  const role = state.roles.find((r) => r.id === id);
  if (!role) {
    return res.status(404).json({ error: 'Role not found.' });
  }

  if (role.name === 'Super Admin') {
    return res.status(400).json({ error: 'Root Super Admin role cannot be deleted.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  let affectedUsersCount = 0;

  dbStore.mutate((s) => {
    // Automatically strip deleted role from all users who hold it
    s.users.forEach((u) => {
      if (u.roles.includes(role.name)) {
        u.roles = u.roles.filter((r) => r !== role.name);
        if (u.roles.length === 0) {
          u.roles = ['Employee']; // default fallback
        }
        affectedUsersCount++;
      }
    });

    s.roles = s.roles.filter((r) => r.id !== id);

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Delete Role',
      entity: 'RBAC',
      entityId: id,
      details: `Deleted role "${role.name}". Removed role assignment from ${affectedUsersCount} user(s).`,
    });
  });

  return res.json({
    success: true,
    message: `Role "${role.name}" deleted successfully. Unassigned from ${affectedUsersCount} user(s).`,
    affectedUsersCount,
  });
});

// ============================================================================
// DYNAMIC RBAC: PERMISSIONS MANAGEMENT
// ============================================================================

// GET /api/org/permissions - List all dynamic & standard permissions
orgRouter.get('/permissions', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.permissions || []);
});

// POST /api/org/permissions - Create custom dynamic permission
orgRouter.post('/permissions', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { code, name, module, description = '' } = req.body;

  if (!code || !name || !module) {
    return res.status(400).json({ error: 'Permission code, name, and module are required.' });
  }

  const cleanCode = code.trim().toLowerCase();
  const state = dbStore.getState();
  const exists = (state.permissions || []).some((p) => p.code.toLowerCase() === cleanCode);
  if (exists) {
    return res.status(409).json({ error: `Permission with code "${cleanCode}" already exists.` });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const newPermission: PermissionDefinition = {
    id: `perm-${Date.now()}`,
    code: cleanCode,
    name: name.trim(),
    module: module.trim(),
    description: description.trim(),
    isSystem: false,
  };

  dbStore.mutate((s) => {
    if (!s.permissions) s.permissions = [];
    s.permissions.push(newPermission);

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Create Dynamic Permission',
      entity: 'RBAC',
      entityId: newPermission.id,
      details: `Created custom permission [${newPermission.code}] "${newPermission.name}" under ${newPermission.module}.`,
    });
  });

  return res.status(201).json(newPermission);
});

// PUT /api/org/permissions/:id - Update dynamic permission
orgRouter.put('/permissions/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { code, name, module, description } = req.body;

  const state = dbStore.getState();
  const target = (state.permissions || []).find((p) => p.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Permission not found.' });
  }

  const oldCode = target.code;
  const newCode = code ? code.trim().toLowerCase() : oldCode;

  if (newCode !== oldCode) {
    const collision = (state.permissions || []).some((p) => p.id !== id && p.code.toLowerCase() === newCode);
    if (collision) {
      return res.status(409).json({ error: `Permission code "${newCode}" is already in use.` });
    }
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    const p = s.permissions.find((x) => x.id === id);
    if (!p) return;

    p.code = newCode;
    if (name) p.name = name.trim();
    if (module) p.module = module.trim();
    if (typeof description === 'string') p.description = description.trim();

    // If code changed, cascade into role permission arrays
    if (newCode !== oldCode) {
      s.roles.forEach((r) => {
        r.permissions = r.permissions.map((c) => (c === oldCode ? newCode : c));
      });
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Update Permission',
      entity: 'RBAC',
      entityId: id,
      details: `Updated permission [${p.code}] "${p.name}".`,
    });
  });

  const updated = dbStore.getState().permissions.find((p) => p.id === id);
  return res.json(updated);
});

// DELETE /api/org/permissions/:id - Delete dynamic permission
orgRouter.delete('/permissions/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;

  const state = dbStore.getState();
  const target = (state.permissions || []).find((p) => p.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Permission not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    // Strip permission code from all roles
    s.roles.forEach((r) => {
      r.permissions = r.permissions.filter((code) => code !== target.code);
    });

    s.permissions = s.permissions.filter((p) => p.id !== id);

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Delete Permission',
      entity: 'RBAC',
      entityId: id,
      details: `Deleted permission [${target.code}] "${target.name}". Removed from all assigned roles.`,
    });
  });

  return res.json({ success: true, message: `Permission "${target.name}" deleted successfully.` });
});

// ============================================================================
// USER ROLE ASSIGNMENT & PROFILE UPDATES
// ============================================================================

// PUT /api/org/users/:id/roles - Update assigned roles of a user dynamically
orgRouter.put('/users/:id/roles', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ error: 'User must be assigned at least one role.' });
  }

  const state = dbStore.getState();
  const targetUser = state.users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    const u = s.users.find((x) => x.id === id);
    if (!u) return;

    u.roles = roles;

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'Super Administrator',
      action: 'Update User Roles',
      entity: 'User',
      entityId: id,
      details: `Updated roles for ${u.name} (${u.email}) to: [${roles.join(', ')}].`,
    });
  });

  const { passwordHash, ...safeUser } = dbStore.getState().users.find((u) => u.id === id)!;
  return res.json(safeUser);
});

// PUT /api/org/users/:id - Update employee profile, department, team, roles
orgRouter.put('/users/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    designation,
    departmentId,
    teamId,
    roles,
    accountStatus,
    reportingLeadId,
    cardPermissionLevel,
  } = req.body;

  const state = dbStore.getState();
  const targetUser = state.users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);

  dbStore.mutate((s) => {
    const u = s.users.find((x) => x.id === id);
    if (!u) return;

    if (name) u.name = name.trim();
    if (email) u.email = email.trim().toLowerCase();
    if (phone) u.phone = phone.trim();
    if (designation) u.designation = designation.trim();

    if (departmentId !== undefined) {
      u.departmentId = departmentId || '';
      const d = s.departments.find((dept) => dept.id === departmentId);
      u.departmentName = d ? d.name : (departmentId ? 'Unassigned' : 'Unassigned');
    }

    if (teamId !== undefined) {
      u.teamId = teamId || undefined;
      const t = teamId ? s.teams.find((tm) => tm.id === teamId) : undefined;
      u.teamName = t ? t.name : undefined;
    }

    if (Array.isArray(roles) && roles.length > 0) {
      u.roles = roles;
    }

    if (accountStatus && ['Active', 'Inactive', 'Pending Invitation', 'Expired Invitation'].includes(accountStatus)) {
      u.accountStatus = accountStatus;
    }

    if (reportingLeadId !== undefined) {
      u.reportingLeadId = reportingLeadId || undefined;
      const lead = reportingLeadId ? s.users.find((usr) => usr.id === reportingLeadId) : undefined;
      u.reportingLeadName = lead ? lead.name : undefined;
    }

    if (cardPermissionLevel) {
      u.cardPermissionLevel = cardPermissionLevel;
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Update Employee Profile',
      entity: 'User',
      entityId: id,
      details: `Updated profile details for employee ${u.name} (${u.email}) [Dept: ${u.departmentName}, Team: ${u.teamName || 'None'}].`,
    });
  });

  const { passwordHash, ...safeUser } = dbStore.getState().users.find((u) => u.id === id)!;
  return res.json(safeUser);
});

// ============================================================================
// DEPARTMENTS CRUD & AUTOMATIC UNASSIGNMENT ON DELETE
// ============================================================================

// GET /api/org/departments
orgRouter.get('/departments', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  // Recalculate dynamic counts
  const deptsWithCounts = state.departments.map((d) => {
    const teamsCount = state.teams.filter((t) => t.departmentId === d.id).length;
    const employeesCount = state.users.filter((u) => u.departmentId === d.id).length;
    return { ...d, teamsCount, employeesCount };
  });
  return res.json(deptsWithCounts);
});

// POST /api/org/departments - Create department
orgRouter.post('/departments', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, description = '', leadId, leadName } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  const trimmedName = name.trim();
  const state = dbStore.getState();
  const exists = state.departments.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: `Department "${trimmedName}" already exists.` });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const lead = leadId ? state.users.find((u) => u.id === leadId) : undefined;

  const newDept: Department = {
    id: `dept-${Date.now()}`,
    name: trimmedName,
    description: description.trim(),
    leadId: lead ? lead.id : leadId,
    leadName: lead ? lead.name : leadName,
    isActive: true,
    teamsCount: 0,
    employeesCount: 0,
  };

  dbStore.mutate((s) => {
    s.departments.push(newDept);
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Create Department',
      entity: 'Department',
      entityId: newDept.id,
      details: `Created department "${newDept.name}" with lead ${newDept.leadName || 'Unassigned'}.`,
    });
  });

  return res.status(201).json(newDept);
});

// PUT /api/org/departments/:id - Update department
orgRouter.put('/departments/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { name, description, leadId, leadName, isActive } = req.body;

  const state = dbStore.getState();
  const targetDept = state.departments.find((d) => d.id === id);
  if (!targetDept) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const oldName = targetDept.name;
  const newName = name && name.trim() ? name.trim() : oldName;

  if (newName !== oldName) {
    const collision = state.departments.some((d) => d.id !== id && d.name.toLowerCase() === newName.toLowerCase());
    if (collision) {
      return res.status(409).json({ error: `Department "${newName}" already exists.` });
    }
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const lead = leadId ? state.users.find((u) => u.id === leadId) : undefined;

  dbStore.mutate((s) => {
    const d = s.departments.find((x) => x.id === id);
    if (!d) return;

    d.name = newName;
    if (typeof description === 'string') d.description = description.trim();
    if (leadId !== undefined) {
      d.leadId = lead ? lead.id : leadId || undefined;
      d.leadName = lead ? lead.name : leadName || undefined;
    }
    if (isActive !== undefined) d.isActive = Boolean(isActive);

    // If department name changed, cascade to teams and users
    if (newName !== oldName) {
      s.teams.forEach((t) => {
        if (t.departmentId === id) t.departmentName = newName;
      });
      s.users.forEach((u) => {
        if (u.departmentId === id) u.departmentName = newName;
      });
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Update Department',
      entity: 'Department',
      entityId: id,
      details: `Updated department "${d.name}".`,
    });
  });

  const updated = dbStore.getState().departments.find((d) => d.id === id);
  return res.json(updated);
});

// DELETE /api/org/departments/:id - Delete department with automatic employee & team unassignment
orgRouter.delete('/departments/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;

  const state = dbStore.getState();
  const targetDept = state.departments.find((d) => d.id === id);
  if (!targetDept) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  let unassignedEmployeesCount = 0;
  let deletedTeamsCount = 0;

  dbStore.mutate((s) => {
    // 1. AUTOMATIC UNASSIGNMENT: All employees in this department are unassigned
    s.users.forEach((u) => {
      if (u.departmentId === id) {
        u.departmentId = '';
        u.departmentName = 'Unassigned';
        u.teamId = undefined;
        u.teamName = undefined;
        unassignedEmployeesCount++;
      }
    });

    // 2. Cascade remove all teams belonging to this department
    const remainingTeams = s.teams.filter((t) => {
      if (t.departmentId === id) {
        deletedTeamsCount++;
        return false;
      }
      return true;
    });
    s.teams = remainingTeams;

    // 3. Remove department itself
    s.departments = s.departments.filter((d) => d.id !== id);

    // 4. Audit ledger entry
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Delete Department & Auto-Unassign',
      entity: 'Department',
      entityId: id,
      details: `Deleted department "${targetDept.name}". Automatically unassigned ${unassignedEmployeesCount} employee(s) and removed ${deletedTeamsCount} child team(s).`,
    });
  });

  return res.json({
    success: true,
    message: `Department "${targetDept.name}" deleted. ${unassignedEmployeesCount} employee(s) automatically unassigned and ${deletedTeamsCount} team(s) removed.`,
    unassignedEmployeesCount,
    deletedTeamsCount,
  });
});

// ============================================================================
// TEAMS CRUD & AUTOMATIC UNASSIGNMENT ON DELETE
// ============================================================================

// GET /api/org/teams
orgRouter.get('/teams', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  const teamsWithCounts = state.teams.map((t) => {
    const membersCount = state.users.filter((u) => u.teamId === t.id).length;
    return { ...t, membersCount };
  });
  return res.json(teamsWithCounts);
});

// POST /api/org/teams - Create team
orgRouter.post('/teams', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, departmentId, leadId, leadName } = req.body;

  if (!name || !departmentId) {
    return res.status(400).json({ error: 'Team name and departmentId are required.' });
  }

  const state = dbStore.getState();
  const dept = state.departments.find((d) => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: 'Parent department not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const lead = leadId ? state.users.find((u) => u.id === leadId) : undefined;

  const newTeam: Team = {
    id: `team-${Date.now()}`,
    name: name.trim(),
    departmentId: dept.id,
    departmentName: dept.name,
    leadId: lead ? lead.id : leadId,
    leadName: lead ? lead.name : leadName,
    isActive: true,
    membersCount: 0,
  };

  dbStore.mutate((s) => {
    s.teams.push(newTeam);
    const d = s.departments.find((x) => x.id === departmentId);
    if (d) d.teamsCount += 1;

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Create Team',
      entity: 'Team',
      entityId: newTeam.id,
      details: `Created team "${newTeam.name}" under department "${dept.name}".`,
    });
  });

  return res.status(201).json(newTeam);
});

// PUT /api/org/teams/:id - Update team
orgRouter.put('/teams/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;
  const { name, departmentId, leadId, leadName, isActive } = req.body;

  const state = dbStore.getState();
  const targetTeam = state.teams.find((t) => t.id === id);
  if (!targetTeam) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  const lead = leadId ? state.users.find((u) => u.id === leadId) : undefined;
  const oldName = targetTeam.name;
  const newName = name && name.trim() ? name.trim() : oldName;

  dbStore.mutate((s) => {
    const t = s.teams.find((x) => x.id === id);
    if (!t) return;

    t.name = newName;
    if (departmentId && departmentId !== t.departmentId) {
      const newDept = s.departments.find((d) => d.id === departmentId);
      if (newDept) {
        // Adjust counts
        const prevDept = s.departments.find((d) => d.id === t.departmentId);
        if (prevDept && prevDept.teamsCount > 0) prevDept.teamsCount -= 1;
        newDept.teamsCount += 1;
        t.departmentId = newDept.id;
        t.departmentName = newDept.name;
      }
    }

    if (leadId !== undefined) {
      t.leadId = lead ? lead.id : leadId || undefined;
      t.leadName = lead ? lead.name : leadName || undefined;
    }

    if (isActive !== undefined) t.isActive = Boolean(isActive);

    // If team name changed, cascade to users
    if (newName !== oldName) {
      s.users.forEach((u) => {
        if (u.teamId === id) u.teamName = newName;
      });
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Update Team',
      entity: 'Team',
      entityId: id,
      details: `Updated team "${t.name}".`,
    });
  });

  const updated = dbStore.getState().teams.find((t) => t.id === id);
  return res.json(updated);
});

// DELETE /api/org/teams/:id - Delete team with automatic employee unassignment
orgRouter.delete('/teams/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { id } = req.params;

  const state = dbStore.getState();
  const targetTeam = state.teams.find((t) => t.id === id);
  if (!targetTeam) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const currentUser = state.users.find((u) => u.id === currentUserId);
  let unassignedEmployeesCount = 0;

  dbStore.mutate((s) => {
    // 1. AUTOMATIC UNASSIGNMENT: All employees in this team have team unassigned, keeping department
    s.users.forEach((u) => {
      if (u.teamId === id) {
        u.teamId = undefined;
        u.teamName = undefined;
        unassignedEmployeesCount++;
      }
    });

    // 2. Decrement parent department teamsCount
    const parentDept = s.departments.find((d) => d.id === targetTeam.departmentId);
    if (parentDept && parentDept.teamsCount > 0) {
      parentDept.teamsCount -= 1;
    }

    // 3. Remove team
    s.teams = s.teams.filter((t) => t.id !== id);

    // 4. Audit ledger entry
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System Admin',
      action: 'Delete Team & Auto-Unassign',
      entity: 'Team',
      entityId: id,
      details: `Deleted team "${targetTeam.name}". Automatically unassigned ${unassignedEmployeesCount} employee(s) from this team.`,
    });
  });

  return res.json({
    success: true,
    message: `Team "${targetTeam.name}" deleted. ${unassignedEmployeesCount} employee(s) automatically unassigned from team.`,
    unassignedEmployeesCount,
  });
});
