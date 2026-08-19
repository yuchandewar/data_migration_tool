import { BaseConnector } from './BaseConnector';
import { DatabaseConnectionConfig, DatasetSchema } from '@/types/migration';
import { Client } from 'pg';

export class PostgresConnector extends BaseConnector {
  protected config: DatabaseConnectionConfig;
  private client: Client | null = null;

  constructor(config: DatabaseConnectionConfig) {
    super(config);
    this.config = config as DatabaseConnectionConfig;
  }

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = new Client(this.config.connectionUrl ? { connectionString: this.config.connectionUrl } : {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.client?.query('SELECT 1');
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  async listDatasets(): Promise<string[]> {
    if (!this.client) await this.connect();
    const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const res = await this.client!.query(query);
    return res.rows.map(row => row.table_name);
  }

  async getSchema(datasetName: string): Promise<DatasetSchema> {
    if (!this.client) await this.connect();

    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1;
    `;
    
    const res = await this.client!.query(query, [datasetName]);
    
    const schema: DatasetSchema = {
      fields: res.rows.map(row => ({
        name: row.column_name,
        type: this.mapPostgresTypeToGeneric(row.data_type),
        required: row.is_nullable === 'NO'
      }))
    };

    return schema;
  }

  private mapPostgresTypeToGeneric(pgType: string) {
    // Map postgres types to our DataType
    if (pgType.includes('int') || pgType.includes('numeric')) return 'NUMBER';
    if (pgType.includes('bool')) return 'BOOLEAN';
    if (pgType.includes('date') || pgType.includes('time')) return 'DATE';
    return 'STRING';
  }

  async *readData(datasetName: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown> {
    if (!this.client) await this.connect();
    
    // In a real scenario, use a cursor for streaming large datasets
    const res = await this.client!.query(`SELECT * FROM ${datasetName}`);
    yield res.rows;
  }

  async writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void> {
    if (!this.client) await this.connect();
    // Implementation for bulk insert
  }
}
