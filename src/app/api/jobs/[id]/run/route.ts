import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MigrationService } from '@/services/migration.service';
import { PostgresConnector, MysqlConnector, MongodbConnector, CsvConnector, ApiConnector } from '@/lib/connectors';

const connectorMap: Record<string, any> = {
  POSTGRES: PostgresConnector,
  MYSQL: MysqlConnector,
  MONGODB: MongodbConnector,
  CSV: CsvConnector,
  API: ApiConnector
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const jobId = (await params).id;
    
    // Fetch Job with connections
    const jobRecord = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        sourceConnection: true,
        destConnection: true,
      }
    });

    if (!jobRecord) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update status to running
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING' }
    });

    // Parse configs
    const sourceConfig = { ...JSON.parse(jobRecord.sourceConnection.config), id: jobRecord.sourceConnection.id, type: jobRecord.sourceConnection.type };
    const destConfig = { ...JSON.parse(jobRecord.destConnection.config), id: jobRecord.destConnection.id, type: jobRecord.destConnection.type };

    // Instantiate connectors
    const SourceConnectorClass = connectorMap[jobRecord.sourceConnection.type];
    const DestConnectorClass = connectorMap[jobRecord.destConnection.type];

    if (!SourceConnectorClass || !DestConnectorClass) {
      throw new Error('Unsupported connector type in job configuration.');
    }

    const sourceConnector = new SourceConnectorClass(sourceConfig);
    const destConnector = new DestConnectorClass(destConfig);

    // Build internal job object
    const internalJob = {
      id: jobRecord.id,
      name: jobRecord.name,
      sourceConfigId: jobRecord.sourceConnectionId,
      destinationConfigId: jobRecord.destConnectionId,
      transformationRules: JSON.parse(jobRecord.transformationRules),
      status: 'RUNNING' as any,
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt
    };

    // Run migration (fire and forget for now, or await for small datasets)
    const migrationService = new MigrationService();
    
    // We'll await it for the response, but ideally this is a background worker
    migrationService.executeJob(
      internalJob,
      sourceConnector,
      destConnector,
      jobRecord.sourceDatasetName,
      jobRecord.destDatasetName
    ).then(async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' }
      });
    }).catch(async (error) => {
      console.error('Migration failed:', error);
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: error.message }
      });
    });

    return NextResponse.json({ message: 'Job started' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
