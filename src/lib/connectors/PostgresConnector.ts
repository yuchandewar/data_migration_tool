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

    let sslConfig: any = undefined;
    
    // Detect if this is a remote cloud database that requires SSL (Render, Supabase, AWS, etc.)
    const isCloudDb = 
      this.config.connectionUrl?.includes('.com') || 
      this.config.connectionUrl?.includes('.net') || 
      this.config.connectionUrl?.includes('.io') ||
      this.config.host?.includes('.com');

    // Also check if user explicitly passed sslmode in URL
    const hasSslInUrl = this.config.connectionUrl?.includes('sslmode=');

    if (isCloudDb || hasSslInUrl) {
      sslConfig = { rejectUnauthorized: false };
    }

    if (this.config.connectionUrl) {
      this.client = new Client({
        connectionString: this.config.connectionUrl,
        ssl: sslConfig
      });
    } else {
      this.client = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: sslConfig
      });
    }

    try {
      await this.client.connect();
    } catch (e: any) {
      // If it fails because of SSL on a local/unsupported DB, retry without SSL
      if (e.message && e.message.includes('The server does not support SSL connections')) {
        this.client = new Client(this.config.connectionUrl ? { connectionString: this.config.connectionUrl } : {
          host: this.config.host, port: this.config.port, database: this.config.database, user: this.config.username, password: this.config.password
        });
        await this.client.connect();
      } else {
        throw e;
      }
    }
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
    
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    if (columns.length === 0) return;

    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const row of data) {
      const rowPlaceholders: string[] = [];
      for (const col of columns) {
        values.push(row[col] !== undefined ? row[col] : null);
        rowPlaceholders.push(`$${paramIndex}`);
        paramIndex++;
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const query = `INSERT INTO "${datasetName}" ("${columns.join('", "')}") VALUES ${placeholders.join(', ')}`;

    try {
      await this.client!.query(query, values);
    } catch (e: any) {
      // Auto-create table if it doesn't exist
      if (e.message && e.message.includes('relation') && e.message.includes('does not exist')) {
        console.log(`Table ${datasetName} does not exist, creating...`);
        const createCols = columns.map(col => {
          const val = data[0][col];
          let type = 'TEXT';
          if (typeof val === 'number') type = 'DOUBLE PRECISION';
          if (typeof val === 'boolean') type = 'BOOLEAN';
          return `"${col}" ${type}`;
        });
        await this.client!.query(`CREATE TABLE "${datasetName}" (${createCols.join(', ')});`);
        // Retry insert
        await this.client!.query(query, values);
      } else {
        console.error('Error writing data to Postgres:', e);
        throw new Error(`Failed to write data: ${e.message}`);
      }
    }
  }
}
