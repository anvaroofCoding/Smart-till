import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { Public } from '../common/decorators/public.decorator';
import { isRedisClient } from '../redis/redis.factory';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: RedisClientType | null,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Tizim holati tekshiruvi' })
  async check() {
    const mongoOk = this.mongo.readyState === 1;
    const redisEnabled = this.config.get<boolean>('redis.enabled');
    let redisOk = false;

    if (redisEnabled && isRedisClient(this.redis)) {
      try {
        const pong = await this.redis.ping();
        redisOk = pong === 'PONG';
      } catch {
        redisOk = false;
      }
    }

    const status =
      mongoOk && (!redisEnabled || redisOk) ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoOk ? 'up' : 'down',
        redis: !redisEnabled ? 'disabled' : redisOk ? 'up' : 'down',
      },
    };
  }
}
