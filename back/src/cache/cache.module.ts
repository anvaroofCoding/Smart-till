import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { isRedisClient } from '../redis/redis.factory';
import type { RedisClientType } from 'redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: async (
        config: ConfigService,
        redis: RedisClientType | null,
      ) => {
        if (isRedisClient(redis)) {
          return {
            store: await redisStore({
              socket: {
                host: config.get<string>('redis.host'),
                port: config.get<number>('redis.port'),
              },
              password: config.get<string>('redis.password'),
              ttl: (config.get<number>('redis.ttl') ?? 3600) * 1000,
            }),
          };
        }

        return {
          ttl: (config.get<number>('redis.ttl') ?? 3600) * 1000,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
