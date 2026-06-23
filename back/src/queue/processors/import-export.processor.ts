import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../common/constants/queue';

export interface ImportExportJobData {
  type: 'import' | 'export';
  fileName: string;
  userId: string;
}

@Processor(QUEUE_NAMES.IMPORT_EXPORT)
export class ImportExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportExportProcessor.name);

  async process(job: Job<ImportExportJobData>): Promise<{ success: boolean }> {
    this.logger.log(
      `Processing ${job.data.type} job: ${job.name} (${job.id})`,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
