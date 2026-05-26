import { env } from './config/env';
import { createApp } from './app';

async function main(): Promise<void> {
  const app = await createApp();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
