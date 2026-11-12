import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbStore, verifyPassword, hashPassword, ServerUser } from '../data/store';

export const authRouter = Router();

// In-memory token maps for magic links and OTPs
interface TokenEntry {
  userId: string;
  tokenHash: string;
  type: 'magic_link' | 'password_reset';
  expiresAt: number;
  isUsed: boolean;
}

interface OtpEntry {
  userId: string;
  otpHash: string;
  action: string;
  attempts: number;
  expiresAt: number;
}

const tokensMap = new Map<string, TokenEntry>();
const otpsMap = new Map<string, OtpEntry>();

// Rate limiting for auth
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const attemptInfo = failedLoginAttempts.get(normalizedEmail);
  const now = Date.now();

  if (attemptInfo && attemptInfo.lockedUntil > now) {
    const remainingSec = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed attempts. Account temporarily locked for ${remainingSec} seconds.`,
    });
  }

  const state = dbStore.getState();
  const user = state.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (user.accountStatus === 'Inactive' || user.accountStatus === 'Expired Invitation') {
    return res.status(403).json({ error: 'Account is inactive. Please contact an administrator.' });
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    const prevAttempts = attemptInfo ? attemptInfo.count + 1 : 1;
    const isLocked = prevAttempts >= 5;
    failedLoginAttempts.set(normalizedEmail, {
      count: prevAttempts,
      lockedUntil: isLocked ? now + 60 * 1000 : 0,
    });

    dbStore.mutate((s) => {
      s.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        action: 'Failed Login Attempt',
        entity: 'Authentication',
        entityId: user.id,
        details: `Failed password attempt for user ${user.email}`,
      });
    });

    return res.status(401).json({
      error: isLocked
        ? 'Account locked for 60 seconds due to 5 consecutive failed attempts.'
        : 'Invalid credentials.',
    });
  }

  // Clear failed attempts on success
  failedLoginAttempts.delete(normalizedEmail);

  // Append audit event
  dbStore.mutate((s) => {
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action: 'User Login',
      entity: 'Authentication',
      entityId: user.id,
      details: `User ${user.email} successfully logged in.`,
    });
  });

  const { passwordHash, ...safeUser } = user;
  const token = `rltsms_jwt_${user.id}_${Date.now()}`;

  return res.json({
    user: safeUser,
    token,
    message: 'Authentication successful.',
  });
});

authRouter.get('/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'usr-admin';
  const state = dbStore.getState();
  const user = state.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json(safeUser);
});

// Magic link generation (Admin creates invitation / activation)
authRouter.post('/magic-link/generate', (req: Request, res: Response) => {
  const { userId } = req.body;
  const state = dbStore.getState();
  const user = state.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48-hour expiration per PRD

  tokensMap.set(tokenHash, {
    userId: user.id,
    tokenHash,
    type: 'magic_link',
    expiresAt,
    isUsed: false,
  });

  const activationUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}/activate?token=${rawToken}`;

  // Log email delivery
  dbStore.mutate((s) => {
    s.emailLogs.unshift({
      id: `elog-${Date.now()}`,
      templateKey: 'magic_link_activation',
      templateName: 'Magic Link Account Activation',
      recipientEmail: user.email,
      recipientName: user.name,
      subject: `Secure One-Click Activation for ${user.name}`,
      status: 'Sent',
      attemptCount: 1,
      providerMessageId: `msg_${Date.now()}`,
      dispatchedAt: new Date().toISOString(),
    });
  });

  return res.json({
    success: true,
    activationUrl,
    expiresAt: new Date(expiresAt).toISOString(),
    message: 'Cryptographically secure 48h activation token generated.',
  });
});

// Magic link verification & activation
authRouter.post('/magic-link/activate', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const entry = tokensMap.get(tokenHash);

  if (!entry) {
    return res.status(400).json({ error: 'Invalid or expired activation link.' });
  }

  if (entry.isUsed) {
    return res.status(400).json({ error: 'This activation token has already been consumed.' });
  }

  if (Date.now() > entry.expiresAt) {
    return res.status(400).json({ error: 'Activation link has expired (48h window exceeded).' });
  }

  // Mark token used
  entry.isUsed = true;
  tokensMap.set(tokenHash, entry);

  const newHash = hashPassword(newPassword);

  dbStore.mutate((s) => {
    const user = s.users.find((u) => u.id === entry.userId);
    if (user) {
      user.accountStatus = 'Active';
      user.passwordHash = newHash;
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: entry.userId,
      userName: user ? user.name : 'Unknown User',
      action: 'Account Activated',
      entity: 'Users',
      entityId: entry.userId,
      details: 'Account successfully activated via single-use magic link.',
    });
  });

  return res.json({ success: true, message: 'Account successfully activated and password configured.' });
});

// Request 6-digit OTP
authRouter.post('/request-otp', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'usr-admin';
  const { action = 'security_verification' } = req.body;
  const state = dbStore.getState();
  const user = state.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5-minute expiry

  otpsMap.set(user.id, {
    userId: user.id,
    otpHash,
    action,
    attempts: 0,
    expiresAt,
  });

  // Log email delivery
  dbStore.mutate((s) => {
    s.emailLogs.unshift({
      id: `elog-${Date.now()}`,
      templateKey: 'otp_verification',
      templateName: 'OTP Verification Security Code',
      recipientEmail: user.email,
      recipientName: user.name,
      subject: `[RLTSMS Security] Your verification code is ${otpCode}`,
      status: 'Sent',
      attemptCount: 1,
      dispatchedAt: new Date().toISOString(),
    });
  });

  return res.json({
    success: true,
    message: 'OTP dispatched to registered email.',
    expiresInSeconds: 300,
    // Dev preview helper
    demoOtp: otpCode,
  });
});

// Verify 6-digit OTP
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'usr-admin';
  const { code } = req.body;

  const entry = otpsMap.get(userId);
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP verification session found.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpsMap.delete(userId);
    return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
  }

  entry.attempts += 1;
  if (entry.attempts > 3) {
    otpsMap.delete(userId);
    return res.status(429).json({ error: 'Maximum verification attempts exceeded.' });
  }

  const inputHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
  if (inputHash !== entry.otpHash) {
    return res.status(400).json({ error: `Invalid OTP code. Attempts remaining: ${3 - entry.attempts}` });
  }

  otpsMap.delete(userId);
  return res.json({ success: true, message: 'OTP verification succeeded.' });
});
