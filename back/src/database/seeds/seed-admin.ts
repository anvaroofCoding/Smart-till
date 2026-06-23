import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { UserPosition } from '../../common/constants/positions';

async function seedAdmin() {
  const logger = new Logger('SeedAdmin');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);
    const login = process.env.SEED_ADMIN_LOGIN ?? 'admin';
    const password = process.env.SEED_ADMIN_PASSWORD ?? '123123';
    const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
    const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Administrator';

    const existing = await usersService.findByLogin(login);

    if (existing) {
      await usersService.update(existing._id.toString(), {
        password,
        firstName,
        lastName,
        position: UserPosition.ADMIN,
      });
      logger.log(`Admin updated: login=${login}`);
      return;
    }

    const legacyEmail =
      process.env.SEED_ADMIN_EMAIL ?? 'admin@warehouse.uz';
    const legacy = await usersService.findByEmail(legacyEmail);

    if (legacy) {
      await usersService.update(legacy._id.toString(), {
        login,
        password,
        firstName,
        lastName,
        position: UserPosition.ADMIN,
      });
      logger.log(`Legacy admin migrated: ${legacyEmail} -> login=${login}`);
      return;
    }

    await usersService.createFromDto({
      firstName,
      lastName,
      login,
      password,
      phone: '+998 90 000 00 01',
      age: 30,
      position: UserPosition.ADMIN,
    });

    logger.log(`Admin user created: login=${login}`);
  } finally {
    await app.close();
  }
}

void seedAdmin();
