import IORedis, { Redis } from 'ioredis';
import { env } from '../config/env';

export const redisConnection: Redis = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => console.log('[redis] connected'));
redisConnection.on('error', (err) => console.error('[redis] error', err.message));
