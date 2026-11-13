import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection';
import { authRouter } from './routes/auth';
import { cardsRouter } from './routes/cards';
import { accessRouter } from './routes/access';
import { servicesRouter } from './routes/services';
import { accountsRouter } from './routes/accounts';
import { requisitionsRouter } from './routes/requisitions';
import { procurementRouter } from './routes/procurement';
import { subscriptionsRouter } from './routes/subscriptions';
import { emailRouter } from './routes/email';
import { reportsRouter } from './routes/reports';
import { orgRouter } from './routes/organization';
import { auditRouter } from './routes/audit';
import { notificationsRouter } from './routes/notifications';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    system: 'RLTSMS Enterprise API',
    organization: 'Riseup Labs',
    timestamp: new Date().toISOString(),
    version: '2.0.0-PROD',
  });
});

// Register routers
app.use('/api/auth', authRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/access', accessRouter);
app.use('/api/services', servicesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/requisitions', requisitionsRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/email', emailRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/org', orgRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);

// Central error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

export async function startServer(customPort?: number) {
  await initDatabase();
  const listenPort = customPort || PORT;
  return app.listen(listenPort, () => {
    console.log(`[RLTSMS] Enterprise API server listening on http://localhost:${listenPort}`);
  });
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('server/index.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('server/index.js') ||
  process.env.START_SERVER === 'true';

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start RLTSMS server:', err);
  });
}

export default app;
