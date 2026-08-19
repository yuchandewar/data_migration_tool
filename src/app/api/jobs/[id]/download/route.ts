import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostgresConnector, MysqlConnector, MongodbConnector, CsvConnector, ApiConnector } from '@/lib/connectors';
import * as Papa from 'papaparse';

const connectorMap: Record<string, any> = {
  POSTGRES: PostgresConnector,
  MYSQL: MysqlConnector,
  MONGODB: MongodbConnector,
  CSV: CsvConnector,
  API: ApiConnector
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const jobId = (await params).id;
    
    const jobRecord = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        destConnection: true,
      }
    });

    if (!jobRecord) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jobRecord.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Job is not completed yet.' }, { status: 400 });
    }

    const destConfig = { ...JSON.parse(jobRecord.destConnection.config), id: jobRecord.destConnection.id, type: jobRecord.destConnection.type };
    const DestConnectorClass = connectorMap[jobRecord.destConnection.type];

    if (!DestConnectorClass) {
      return NextResponse.json({ error: 'Unsupported destination connector type.' }, { status: 400 });
    }

    const destConnector = new DestConnectorClass(destConfig);
    await destConnector.connect();

    // Read the data from the destination dataset
    const dataStream = destConnector.readData(jobRecord.destDatasetName);
    
    let allData: any[] = [];
    for await (const chunk of dataStream) {
      allData = allData.concat(chunk);
    }

    await destConnector.disconnect();

    // Convert to CSV
    const csvContent = Papa.unparse(allData);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="migration_${jobId}_output.csv"`,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
