import { Router, Request, Response } from 'express';
import { dbStore, verifyPassword } from '../data/store';
import { PaymentCard, CardVisibilityPermission, CardRevealAuditLog } from '../../src/types';

export const cardsRouter = Router();

// Rate limiting for card reveal attempts
const cardRevealAttempts = new Map<string, { count: number; lockedUntil: number }>();

// GET /api/cards - Returns cards list (always masked by default)
cardsRouter.get('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();

  const safeCards = state.cards.map((c) => {
    // Check if current user is owner or explicitly granted visibility
    const isOwner = c.ownerId === currentUserId;
    const isAuthorized = isOwner || c.authorizedUserIds.includes(currentUserId);

    return {
      id: c.id,
      cardName: c.cardName,
      network: c.network,
      bankName: c.bankName,
      currency: c.currency,
      status: c.status,
      ownerId: c.ownerId,
      ownerName: c.ownerName,
      isOwner,
      isAuthorized,
      // Default masked representation
      lastFourMasked: `•••• ${c.lastFour}`,
      holderNameMasked: isAuthorized ? c.holderName : 'Company Cardholder',
      expiryMasked: isAuthorized ? `${c.expiryMonth}/${c.expiryYear.slice(-2)}` : '••/••',
      authorizedUserIds: c.authorizedUserIds,
    };
  });

  return res.json(safeCards);
});

// POST /api/cards - Register payment card
cardsRouter.post('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const {
    cardName,
    network,
    bankName,
    holderName,
    lastFour,
    currency = 'USD',
    expiryMonth,
    expiryYear,
    status = 'Active',
    ownerId,
  } = req.body;

  if (!cardName || !lastFour || lastFour.length !== 4) {
    return res.status(400).json({ error: 'Card Name and valid 4-digit last numbers are required.' });
  }

  const assignedOwnerId = ownerId || currentUserId;
  const assignedOwner = state.users.find((u) => u.id === assignedOwnerId);

  const newCard: PaymentCard = {
    id: `card-${Date.now()}`,
    cardName: cardName.trim(),
    network: network || 'Visa',
    bankName: bankName ? bankName.trim() : 'Commercial Bank',
    holderName: holderName ? holderName.trim() : (assignedOwner ? assignedOwner.name : 'Riseup Labs Corp'),
    lastFour: lastFour.trim(),
    currency: currency || 'USD',
    expiryMonth: expiryMonth || '12',
    expiryYear: expiryYear || '2028',
    status: status || 'Active',
    ownerId: assignedOwnerId,
    ownerName: assignedOwner ? assignedOwner.name : 'Card Owner',
    authorizedUserIds: [assignedOwnerId],
  };

  dbStore.mutate((s) => {
    s.cards.push(newCard);
    s.cardPermissions.push({
      id: `cperm-${Date.now()}`,
      cardId: newCard.id,
      cardName: newCard.cardName,
      ownerId: assignedOwnerId,
      authorizedUserId: assignedOwnerId,
      authorizedUserName: assignedOwner ? assignedOwner.name : 'Card Owner',
      authorizedUserEmail: assignedOwner ? assignedOwner.email : '',
      grantedAt: new Date().toISOString(),
      status: 'Active',
    });

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Register Payment Card',
      entity: 'Payment Cards',
      entityId: newCard.id,
      details: `Registered card ${newCard.cardName} (•••• ${newCard.lastFour}) with owner ${newCard.ownerName}.`,
    });
  });

  return res.status(201).json(newCard);
});

// POST /api/cards/:id/reveal - PASSWORD-PROTECTED REVEAL (Part 9.3 & 9.4)
cardsRouter.post('/:id/reveal', (req: Request, res: Response) => {
  const cardId = req.params.id;
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'RLTSMS user password is required to reveal card information.' });
  }

  const state = dbStore.getState();
  const card = state.cards.find((c) => c.id === cardId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!card || !currentUser) {
    return res.status(404).json({ error: 'Card or User not found.' });
  }

  // Rate-limiting check for password attempts
  const rateKey = `${currentUserId}_${cardId}`;
  const attemptInfo = cardRevealAttempts.get(rateKey);
  const now = Date.now();

  if (attemptInfo && attemptInfo.lockedUntil > now) {
    const remaining = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed password attempts. Card reveal locked for ${remaining} seconds.`,
    });
  }

  // STEP 1: Verify the viewer's own RLTSMS password against backend hash
  const isPasswordValid = verifyPassword(password, currentUser.passwordHash);

  if (!isPasswordValid) {
    const prev = attemptInfo ? attemptInfo.count + 1 : 1;
    const isLocked = prev >= 3;
    cardRevealAttempts.set(rateKey, {
      count: prev,
      lockedUntil: isLocked ? now + 60 * 1000 : 0,
    });

    // Mandatory Audit: Failed password verification
    const failedLog: CardRevealAuditLog = {
      id: `craud-${Date.now()}`,
      cardId: card.id,
      cardName: card.cardName,
      viewerId: currentUser.id,
      viewerName: currentUser.name,
      viewerEmail: currentUser.email,
      action: 'failed_password',
      result: 'Denied',
      timestamp: new Date().toISOString(),
      notes: `Failed password verification attempt by ${currentUser.name}`,
    };

    dbStore.mutate((s) => {
      s.cardRevealLogs.unshift(failedLog);
      s.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'Card Reveal - Password Failed',
        entity: 'Payment Cards',
        entityId: card.id,
        details: `Failed password verification attempting to reveal card ${card.cardName}`,
      });
    });

    return res.status(401).json({
      error: isLocked
        ? 'Card reveal locked for 60 seconds due to 3 failed password attempts.'
        : 'Incorrect account password. Access denied.',
    });
  }

  // STEP 2: Verify Card Owner or Explicit Owner-Granted Visibility
  const isOwner = card.ownerId === currentUserId;
  const hasExplicitPermission = card.authorizedUserIds.includes(currentUserId);

  // Per Part 9.2: No role (even Super Admin) can silently bypass owner restrictions!
  if (!isOwner && !hasExplicitPermission) {
    const unauthorizedLog: CardRevealAuditLog = {
      id: `craud-${Date.now()}`,
      cardId: card.id,
      cardName: card.cardName,
      viewerId: currentUser.id,
      viewerName: currentUser.name,
      viewerEmail: currentUser.email,
      action: 'unauthorized_attempt',
      result: 'Denied',
      timestamp: new Date().toISOString(),
      notes: `User ${currentUser.name} attempted reveal without owner visibility authorization.`,
    };

    dbStore.mutate((s) => {
      s.cardRevealLogs.unshift(unauthorizedLog);
      s.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'Card Reveal - Unauthorized',
        entity: 'Payment Cards',
        entityId: card.id,
        details: `Unauthorized attempt by ${currentUser.name} to reveal card ${card.cardName} (Not authorized by owner).`,
      });
    });

    return res.status(403).json({
      error: `Access Denied: You have not been granted viewing permission by the registered card owner (${card.ownerName || 'Card Owner'}).`,
    });
  }

  // Clear attempts on success
  cardRevealAttempts.delete(rateKey);

  // STEP 3: Record successful reveal event
  const successLog: CardRevealAuditLog = {
    id: `craud-${Date.now()}`,
    cardId: card.id,
    cardName: card.cardName,
    viewerId: currentUser.id,
    viewerName: currentUser.name,
    viewerEmail: currentUser.email,
    action: 'reveal_masked',
    result: 'Success',
    timestamp: new Date().toISOString(),
    notes: `Card information revealed for 30s window. Verification: Password + Owner Authorization.`,
  };

  dbStore.mutate((s) => {
    s.cardRevealLogs.unshift(successLog);
    s.cardLogs.unshift({
      id: `clog-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cardId: card.id,
      cardName: card.cardName,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'view_masked',
      justification: 'Password-verified secure reveal (owner-authorized)',
    });
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'Card Information Revealed',
      entity: 'Payment Cards',
      entityId: card.id,
      details: `Card ${card.cardName} revealed to ${currentUser.name} following password authentication.`,
    });
  });

  // Return permitted card details with short-lived 30s validity
  return res.json({
    success: true,
    revealed: {
      id: card.id,
      cardName: card.cardName,
      network: card.network,
      bankName: card.bankName,
      holderName: card.holderName,
      lastFour: card.lastFour,
      currency: card.currency,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
    },
    autoMaskInSeconds: 30,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/cards/:id/visibility - CARD OWNER VISIBILITY MANAGEMENT (Part 9.2)
cardsRouter.post('/:id/visibility', (req: Request, res: Response) => {
  const cardId = req.params.id;
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { targetUserId, action } = req.body; // action: 'grant' | 'revoke'

  if (!targetUserId || !['grant', 'revoke'].includes(action)) {
    return res.status(400).json({ error: 'Valid targetUserId and action (grant/revoke) are required.' });
  }

  const state = dbStore.getState();
  const card = state.cards.find((c) => c.id === cardId);
  const currentUser = state.users.find((u) => u.id === currentUserId);
  const targetUser = state.users.find((u) => u.id === targetUserId);

  if (!card || !currentUser || !targetUser) {
    return res.status(404).json({ error: 'Card or User not found.' });
  }

  // Check: ONLY the registered card owner can grant or revoke permissions!
  const isOwner = card.ownerId === currentUserId;
  if (!isOwner) {
    return res.status(403).json({
      error: `Permission Denied: Only the registered card owner (${card.ownerName || 'Card Owner'}) has authority to grant or revoke visibility.`,
    });
  }

  dbStore.mutate((s) => {
    const targetCard = s.cards.find((c) => c.id === cardId)!;

    if (action === 'grant') {
      if (!targetCard.authorizedUserIds.includes(targetUserId)) {
        targetCard.authorizedUserIds.push(targetUserId);
      }
      s.cardPermissions.push({
        id: `cperm-${Date.now()}`,
        cardId: targetCard.id,
        cardName: targetCard.cardName,
        ownerId: currentUserId,
        authorizedUserId: targetUser.id,
        authorizedUserName: targetUser.name,
        authorizedUserEmail: targetUser.email,
        grantedAt: new Date().toISOString(),
        status: 'Active',
      });
      s.cardRevealLogs.unshift({
        id: `craud-${Date.now()}`,
        cardId: targetCard.id,
        cardName: targetCard.cardName,
        viewerId: currentUserId,
        viewerName: currentUser.name,
        viewerEmail: currentUser.email,
        action: 'visibility_granted',
        result: 'Success',
        timestamp: new Date().toISOString(),
        notes: `Card owner ${currentUser.name} granted viewing permission to ${targetUser.name}`,
      });
    } else {
      targetCard.authorizedUserIds = targetCard.authorizedUserIds.filter((id) => id !== targetUserId);
      const perm = s.cardPermissions.find(
        (p) => p.cardId === cardId && p.authorizedUserId === targetUserId && p.status === 'Active'
      );
      if (perm) {
        perm.status = 'Revoked';
        perm.revokedAt = new Date().toISOString();
      }
      s.cardRevealLogs.unshift({
        id: `craud-${Date.now()}`,
        cardId: targetCard.id,
        cardName: targetCard.cardName,
        viewerId: currentUserId,
        viewerName: currentUser.name,
        viewerEmail: currentUser.email,
        action: 'visibility_revoked',
        result: 'Success',
        timestamp: new Date().toISOString(),
        notes: `Card owner ${currentUser.name} revoked viewing permission from ${targetUser.name}`,
      });
    }

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser.name,
      action: action === 'grant' ? 'Card Visibility Granted' : 'Card Visibility Revoked',
      entity: 'Payment Cards',
      entityId: targetCard.id,
      details: `${action === 'grant' ? 'Granted' : 'Revoked'} visibility permission for user ${targetUser.name} on card ${targetCard.cardName}.`,
    });
  });

  return res.json({
    success: true,
    message: `Visibility permission ${action === 'grant' ? 'granted to' : 'revoked from'} ${targetUser.name}.`,
    authorizedUserIds: card.authorizedUserIds,
  });
});

// GET /api/cards/:id/visibility-history
cardsRouter.get('/:id/visibility-history', (req: Request, res: Response) => {
  const cardId = req.params.id;
  const state = dbStore.getState();
  const perms = state.cardPermissions.filter((p) => p.cardId === cardId);
  return res.json(perms);
});

// GET /api/cards/logs
cardsRouter.get('/logs/all', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json({
    accessLogs: state.cardLogs,
    revealAuditLogs: state.cardRevealLogs,
  });
});
