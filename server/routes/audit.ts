import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';

export const auditRouter = Router();

// GET /api/audit - Immutable system audit logs
auditRouter.get('/', (req: Request, res: Response) => {
  const { entity, search } = req.query;
  const state = dbStore.getState();
  let list = state.auditLogs;

  if (entity && entity !== 'all') {
    list = list.filter((a) => a.entity.toLowerCase() === String(entity).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (a) =>
        a.action.toLowerCase().includes(q) ||
        a.userName.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q)
    );
  }

  return res.json(list);
});
