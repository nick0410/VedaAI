import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/app';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!appPromise) appPromise = createApp();
  const app = await appPromise;
  app(req as never, res as never);
}
