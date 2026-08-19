import { BaseConnector } from './BaseConnector';
import { DatabaseConnectionConfig, DatasetSchema } from '@/types/migration';
import mysql from 'mysql2/promise';

export class MysqlConnector extends BaseConnector {
  protected config: DatabaseConnectionConfig;
  private connection: mysql.Connection | null = null;

  constructor(config: DatabaseConnectionConfig) {
    super(config);
    this.config = config as DatabaseConnectionConfig;
  }

  async connect(): Promise<void> {
    if (this.connection) return;

    if (this.config.connectionUrl) {
      this.connection = await mysql.createConnection(this.config.connectionUrl);
    } else {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.connection?.query('SELECT 1');
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  async listDatasets(): Promise<string[]> {
    if (!this.connection) await this.connect();
    const [rows] = await this.connection!.query('SHOW TABLES');
    return (rows as any[]).map(row => Object.values(row)[0] as string);
  }

  async getSchema(datasetName: string): Promise<DatasetSchema> {
    if (!this.connection) await this.connect();

    const [rows] = await this.connection!.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?
    `, [datasetName, this.config.database]);
    
    const schema: DatasetSchema = {
      fields: (rows as any[]).map(row => ({
        name: row.COLUMN_NAME,
        type: this.mapMysqlTypeToGeneric(row.DATA_TYPE),
        required: row.IS_NULLABLE === 'NO'
      }))
    };

    return schema;
  }

  private mapMysqlTypeToGeneric(mysqlType: string) {
    if (mysqlType.includes('int') || mysqlType.includes('decimal') || mysqlType.includes('float')) return 'NUMBER';
    if (mysqlType.includes('tinyint(1)')) return 'BOOLEAN';
    if (mysqlType.includes('date') || mysqlType.includes('timestamp')) return 'DATE';
    return 'STRING';
  }

  async *readData(datasetName: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown> {
    if (!this.connection) await this.connect();
    
    // In a real scenario, use streaming for large datasets
    const [rows] = await this.connection!.query(`SELECT * FROM ??`, [datasetName]);
    yield rows as any[];
  }

  async writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void> {
    if (!this.connection) await this.connect();
    // Implementation for bulk insert
  }
}
