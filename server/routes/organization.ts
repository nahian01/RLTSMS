import { Router, Request, Response } from 'express';
import { dbStore, hashPassword } from '../data/store';
import { Department, Team, User } from '../../src/types';

export const orgRouter = Router();

// GET /api/org/users
orgRouter.get('/users', (req: Request, res: Response) => {
  const state = dbStore.getState();
  const safeUsers = state.users.map(({ passwordHash, ...u }) => u);
  return res.json(safeUsers);
});

// POST /api/org/users - Invite employee (Minimal enterprise schema)
orgRouter.post('/users', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, email, phone, designation, departmentId, teamId, roles = ['Employee'] } = req.body;

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
    roles,
    accountStatus: 'Pending Invitation',
    invitationSentAt: new Date().toISOString(),
    invitationExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    cardPermissionLevel: 'none',
  };

  const tempPass = hashPassword('RiseupLabs@2026');

  dbStore.mutate((s) => {
    s.users.push({ ...newUser, passwordHash: tempPass });

    // Log invitation email dispatch
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
      action: 'Invite Employee',
      entity: 'Organization',
      entityId: newUser.id,
      details: `Invited new employee ${newUser.name} (${newUser.email}) to ${newUser.departmentName}.`,
    });
  });

  return res.status(201).json(newUser);
});

// GET /api/org/departments
orgRouter.get('/departments', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.departments);
});

// GET /api/org/teams
orgRouter.get('/teams', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.teams);
});
