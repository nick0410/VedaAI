import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectMongo } from './db/mongo';
import assignmentsRouter from './routes/assignments';
import authRouter from './routes/auth';
import groupsRouter from './routes/groups';

let appPromise: Promise<Express> | null = null;
let mongoReady = false;

async function ensureMongo(): Promise<void> {
  if (mongoReady) return;
  await connectMongo();
  mongoReady = true;
}

export async function createApp(): Promise<Express> {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    await ensureMongo();

    const allowedOrigins = env.corsOrigin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const app = express();
    app.use(
      cors({
        origin: (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return cb(null, true);
          }
          return cb(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
      })
    );
    app.use(express.json({ limit: '5mb' }));

    app.get('/api/health', (_req, res) => res.json({ ok: true }));
    app.use('/api/auth', authRouter);
    app.use('/api/assignments', assignmentsRouter);
    app.use('/api/groups', groupsRouter);

    return app;
  })();
  return appPromise;
}
