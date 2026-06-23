import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

const CONNECT_TIMEOUT_MS = 3000;

export async function createRedisClient(
  config: ConfigService,
): Promise<RedisClientType | null> {
  const logger = new Logger('Redis');
  const enabled = config.get<boolean>('redis.enabled');

  if (!enabled) {
    logger.warn('Redis disabled — using in-memory fallbacks for cache and sessions');
    return null;
  }

  const host = config.get<string>('redis.host') ?? '127.0.0.1';
  const port = config.get<number>('redis.port') ?? 6379;
  const password = config.get<string>('redis.password');

  const client = createClient({
    socket: {
      host,
      port,
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
    },
    password,
  });

  client.on('error', (err) => {
    if ('code' in err && err.code === 'ECONNREFUSED') {
      return;
    }
    logger.error('Redis client error', err);
  });

  try {
    await client.connect();
    logger.log(`Redis connected (${host}:${port})`);
    return client as RedisClientType;
  } catch (error) {
    await client.quit().catch(() => undefined);

    if (config.get<string>('app.env') === 'production') {
      throw error;
    }

    logger.warn(
      `Redis unavailable at ${host}:${port} — using in-memory fallbacks`,
    );
    return null;
  }
}

export function isRedisClient(
  client: RedisClientType | null,
): client is RedisClientType {
  return client !== null;
}
