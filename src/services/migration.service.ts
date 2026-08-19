import { BaseConnector } from '@/lib/connectors';
import { MigrationJob, JobStatus } from '@/types/migration';
import { TransformationService } from './transformation.service';

/**
 * Service responsible for orchestrating the data migration process.
 */
export class MigrationService {
  private transformationService: TransformationService;

  constructor() {
    this.transformationService = new TransformationService();
  }

  /**
   * Executes a migration job.
   * @param job - The migration job details
   * @param sourceConnector - Initialized source connector
   * @param destConnector - Initialized destination connector
   */
  public async executeJob(
    job: MigrationJob, 
    sourceConnector: BaseConnector, 
    destConnector: BaseConnector,
    sourceDatasetName: string,
    destDatasetName: string
  ): Promise<void> {
    try {
      this.updateJobStatus(job, 'RUNNING');
      
      await sourceConnector.connect();
      await destConnector.connect();

      const dataStream = sourceConnector.readData(sourceDatasetName);

      for await (const chunk of dataStream) {
        // Transform
        const transformedChunk = await this.transformationService.transform(chunk, job.transformationRules);
        
        // Load
        await destConnector.writeData(destDatasetName, transformedChunk);
      }

      this.updateJobStatus(job, 'COMPLETED');
    } catch (error: any) {
      this.updateJobStatus(job, 'FAILED', error.message);
      throw error;
    } finally {
      await sourceConnector.disconnect();
      await destConnector.disconnect();
    }
  }

  private updateJobStatus(job: MigrationJob, status: JobStatus, error?: string) {
    job.status = status;
    job.updatedAt = new Date();
    if (error) {
      job.error = error;
    }
    // In a real app, save to database here
    console.log(`Job ${job.id} status updated to ${status}`);
  }
}
