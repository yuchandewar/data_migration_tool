import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostgresConnector, MysqlConnector, MongodbConnector, CsvConnector, ApiConnector } from '@/lib/connectors';

const connectorMap: Record<string, any> = {
  POSTGRES: PostgresConnector,
  MYSQL: MysqlConnector,
  MONGODB: MongodbConnector,
  CSV: CsvConnector,
  API: ApiConnector
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const connectionId = (await params).id;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    const config = { ...JSON.parse(connection.config), id: connection.id, type: connection.type };
    const ConnectorClass = connectorMap[connection.type];

    if (!ConnectorClass) {
      return NextResponse.json({ error: 'Unsupported connector type.' }, { status: 400 });
    }

    const connector = new ConnectorClass(config);
    await connector.connect();
    const datasets = await connector.listDatasets();
    await connector.disconnect();

    return NextResponse.json(datasets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
