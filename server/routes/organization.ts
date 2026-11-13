import { Router, Request, Response } from 'express';
import { dbStore, hashPassword } from '../data/store';
import { Department, Team, User, RoleDefinition } from '../../src/types';

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

// GET /api/org/departments
orgRouter.get('/departments', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.departments);
});

// GET /api/org/teams
orgRouter.get('/teams', (_req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.teams);
});
