import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '../common/constants/queue';
import { ImportExportProcessor } from './processors/import-export.processor';

function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== 'false';
}

@Module({})
export class QueueModule {
  static register(): DynamicModule {
    if (!isRedisEnabled()) {
      return { module: QueueModule };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('redis.host'),
              port: config.get<number>('redis.port'),
              password: config.get<string>('redis.password'),
            },
          }),
        }),
        BullModule.registerQueue(
          { name: QUEUE_NAMES.IMPORT_EXPORT },
          { name: QUEUE_NAMES.NOTIFICATIONS },
        ),
      ],
      providers: [ImportExportProcessor],
      exports: [BullModule],
    };
  }
}
