import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { CatalogueService, ServiceCategory } from '../../src/types';

export const servicesRouter = Router();

// GET /api/services - Catalogue list
servicesRouter.get('/', (req: Request, res: Response) => {
  const { category, type, search } = req.query;
  const state = dbStore.getState();
  let list = state.services;

  if (type && type !== 'all') {
    list = list.filter((s) => s.type === type);
  }
  if (category && category !== 'all') {
    list = list.filter((s) => s.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }

  return res.json(list);
});

// POST /api/services - Create new catalogue master service
servicesRouter.post('/', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const state = dbStore.getState();
  const currentUser = state.users.find((u) => u.id === currentUserId);

  const { name, type, category, subcategory, provider, website, description } = req.body;

  if (!name || !type || !category || !provider) {
    return res.status(400).json({ error: 'Name, type, category, and provider are required.' });
  }

  const newService: CatalogueService = {
    id: `srv-${Date.now()}`,
    name: name.trim(),
    type,
    category,
    subcategory: subcategory || category,
    provider: provider.trim(),
    website: website ? website.trim() : 'https://riseuplabs.com',
    description: description ? description.trim() : '',
    status: 'Active',
    createdBy: currentUser ? currentUser.name : 'System Admin',
    createdAt: new Date().toISOString(),
    accountsCount: 0,
    totalMonthlySpend: 0,
  };

  dbStore.mutate((s) => {
    s.services.unshift(newService);
    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Register Master Service',
      entity: 'Services Catalogue',
      entityId: newService.id,
      details: `Created new master catalogue service: ${newService.name} (${newService.category}).`,
    });
  });

  return res.status(201).json(newService);
});

// GET /api/services/categories
servicesRouter.get('/categories', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.categories);
});
