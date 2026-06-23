import { Global, Module, OnModuleDestroy, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.constants';
import { createRedisClient, isRedisClient } from './redis.factory';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createRedisClient(config),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: RedisClientType | null,
  ) {}

  async onModuleDestroy() {
    if (isRedisClient(this.redis)) {
      await this.redis.quit().catch(() => undefined);
    }
  }
}
