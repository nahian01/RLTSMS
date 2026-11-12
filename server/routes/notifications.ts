import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';

export const notificationsRouter = Router();

// GET /api/notifications - User notifications
notificationsRouter.get('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const list = state.notifications.filter(
    (n) => n.recipientId === currentUserId || n.recipientId === 'all' || currentUserId === 'usr-admin'
  );
  return res.json(list);
});

// PATCH /api/notifications/:id/read - Mark single notification read
notificationsRouter.patch('/:id/read', (req: Request, res: Response) => {
  const notifId = req.params.id;
  dbStore.mutate((s) => {
    const target = s.notifications.find((n) => n.id === notifId);
    if (target) target.isRead = true;
  });
  return res.json({ success: true });
});

// POST /api/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  dbStore.mutate((s) => {
    s.notifications.forEach((n) => {
      if (n.recipientId === currentUserId || currentUserId === 'usr-admin') {
        n.isRead = true;
      }
    });
  });
  return res.json({ success: true });
});
