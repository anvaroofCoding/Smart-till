import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('app.env') !== 'development') {
      return;
    }

    if (!this.config.get<boolean>('seed.adminOnStartup')) {
      return;
    }

    const result = await this.usersService.ensureSeedAdmin(
      {
        login: this.config.get<string>('seed.adminLogin') ?? 'admin',
        password: this.config.get<string>('seed.adminPassword') ?? '123123',
        firstName: this.config.get<string>('seed.adminFirstName') ?? 'Admin',
        lastName: this.config.get<string>('seed.adminLastName') ?? 'Administrator',
        legacyEmail:
          this.config.get<string>('seed.adminLegacyEmail') ?? 'admin@warehouse.uz',
      },
      'bootstrap',
    );

    if (result === 'skipped') {
      return;
    }

    const messages: Record<Exclude<typeof result, 'skipped'>, string> = {
      created: 'Admin user created',
      updated: 'Admin user ensured (reactivated if needed)',
      migrated: 'Legacy admin migrated to seed login',
    };

    this.logger.log(messages[result]);
  }
}
