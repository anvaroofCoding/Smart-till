import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';

async function seedAdmin() {
  const logger = new Logger('SeedAdmin');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);
    const config = app.get(ConfigService);

    const result = await usersService.ensureSeedAdmin(
      {
        login: config.get<string>('seed.adminLogin') ?? 'admin',
        password: config.get<string>('seed.adminPassword') ?? '123123',
        firstName: config.get<string>('seed.adminFirstName') ?? 'Admin',
        lastName: config.get<string>('seed.adminLastName') ?? 'Administrator',
        legacyEmail:
          config.get<string>('seed.adminLegacyEmail') ?? 'admin@warehouse.uz',
      },
      'force',
    );

    const login = config.get<string>('seed.adminLogin') ?? 'admin';
    const messages: Record<typeof result, string> = {
      created: `Admin user created: login=${login}`,
      updated: `Admin updated: login=${login}`,
      migrated: `Legacy admin migrated -> login=${login}`,
      skipped: `Admin already active: login=${login}`,
    };

    logger.log(messages[result]);
  } finally {
    await app.close();
  }
}

void seedAdmin();
