import { Logger } from '@nestjs/common';
import { createClient } from 'redis';

const CONNECT_TIMEOUT_MS = 2000;

export async function ensureRedisAvailability(): Promise<void> {
  if (process.env.REDIS_ENABLED === 'false') {
    return;
  }

  const logger = new Logger('Bootstrap');
  const host = process.env.REDIS_HOST ?? '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const isProduction = process.env.NODE_ENV === 'production';

  const client = createClient({
    socket: { host, port, connectTimeout: CONNECT_TIMEOUT_MS },
    password,
  });

  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), CONNECT_TIMEOUT_MS),
      ),
    ]);
    await client.ping();
    await client.quit();
  } catch {
    await client.quit().catch(() => undefined);

    if (isProduction) {
      throw new Error(
        `Redis is required in production but unavailable at ${host}:${port}`,
      );
    }

    process.env.REDIS_ENABLED = 'false';
    logger.warn(
      `Redis unavailable at ${host}:${port} — running without Redis. ` +
        'Start Redis (npm run docker:up) or keep REDIS_ENABLED=false in .env',
    );
  }
}
