import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { isRedisClient } from '../redis/redis.factory';

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_SECONDS = 20;

interface AttemptState {
  failures: number;
  blockedUntil?: number;
}

@Injectable()
export class LoginAttemptService {
  private readonly memory = new Map<string, AttemptState>();

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: RedisClientType | null,
  ) {}

  async assertCanAttempt(login: string): Promise<void> {
    const key = this.normalizeLogin(login);
    const state = await this.readState(key);
    const now = Date.now();

    if (state.blockedUntil && state.blockedUntil > now) {
      this.throwBlocked(state.blockedUntil);
    }

    if (state.blockedUntil && state.blockedUntil <= now) {
      await this.reset(key);
    }
  }

  async recordFailure(login: string): Promise<void> {
    const key = this.normalizeLogin(login);
    const state = await this.readState(key);
    const failures = state.failures + 1;

    if (failures >= MAX_ATTEMPTS) {
      const blockedUntil = Date.now() + BLOCK_DURATION_SECONDS * 1000;
      await this.writeState(key, { failures: 0, blockedUntil });
      this.throwBlocked(blockedUntil);
    }

    await this.writeState(key, { failures });
  }

  async recordSuccess(login: string): Promise<void> {
    await this.reset(this.normalizeLogin(login));
  }

  private throwBlocked(blockedUntil: number): never {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((blockedUntil - Date.now()) / 1000),
    );

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Juda ko'p noto'g'ri urinish. ${retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.`,
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private normalizeLogin(login: string): string {
    return login.trim().toLowerCase();
  }

  private failKey(login: string): string {
    return `login:fail:${login}`;
  }

  private blockKey(login: string): string {
    return `login:block:${login}`;
  }

  private async readState(login: string): Promise<AttemptState> {
    if (isRedisClient(this.redis)) {
      const blockedUntilRaw = await this.redis.get(this.blockKey(login));
      if (blockedUntilRaw) {
        const blockedUntil = Number.parseInt(blockedUntilRaw, 10);
        if (!Number.isNaN(blockedUntil) && blockedUntil > Date.now()) {
          return { failures: 0, blockedUntil };
        }
      }

      const failuresRaw = await this.redis.get(this.failKey(login));
      const failures = failuresRaw ? Number.parseInt(failuresRaw, 10) : 0;
      return { failures: Number.isNaN(failures) ? 0 : failures };
    }

    return this.memory.get(login) ?? { failures: 0 };
  }

  private async writeState(login: string, state: AttemptState): Promise<void> {
    if (isRedisClient(this.redis)) {
      if (state.blockedUntil) {
        const ttlSeconds = Math.max(
          1,
          Math.ceil((state.blockedUntil - Date.now()) / 1000),
        );
        await this.redis.set(this.blockKey(login), String(state.blockedUntil), {
          EX: ttlSeconds,
        });
        await this.redis.del(this.failKey(login));
        return;
      }

      if (state.failures <= 0) {
        await this.redis.del(this.failKey(login));
        return;
      }

      await this.redis.set(this.failKey(login), String(state.failures), {
        EX: 3600,
      });
      return;
    }

    this.memory.set(login, state);
  }

  private async reset(login: string): Promise<void> {
    if (isRedisClient(this.redis)) {
      await this.redis.del([this.failKey(login), this.blockKey(login)]);
      return;
    }

    this.memory.delete(login);
  }
}
