import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env';
import { connectMongo } from './db/mongo';
import { initSocket } from './ws/socket';
import { startWorker } from './queue/worker';
import assignmentsRouter from './routes/assignments';
import authRouter from './routes/auth';
import groupsRouter from './routes/groups';

async function main(): Promise<void> {
  await connectMongo();

  const allowedOrigins = env.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const app = express();
  app.use(
    cors({
      origin: (origin, cb) => {
        // allow non-browser clients (curl, server-to-server) and matching origins
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        if (allowedOrigins.includes('*')) return cb(null, true);
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

  const server = http.createServer(app);
  initSocket(server);
  startWorker();

  server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
