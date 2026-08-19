import { BaseConnector } from './BaseConnector';
import { DatabaseConnectionConfig, DatasetSchema } from '@/types/migration';
import { MongoClient } from 'mongodb';

export class MongodbConnector extends BaseConnector {
  protected config: DatabaseConnectionConfig;
  private client: MongoClient | null = null;

  constructor(config: DatabaseConnectionConfig) {
    super(config);
    this.config = config as DatabaseConnectionConfig;
  }

  private buildUri(): string {
    if (this.config.connectionUrl) {
      return this.config.connectionUrl;
    }
    const auth = this.config.username ? `${this.config.username}:${this.config.password}@` : '';
    return `mongodb://${auth}${this.config.host}:${this.config.port}/${this.config.database}`;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    this.client = new MongoClient(this.buildUri());
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.client?.db().command({ ping: 1 });
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  async listDatasets(): Promise<string[]> {
    if (!this.client) await this.connect();
    const collections = await this.client!.db().listCollections().toArray();
    return collections.map(c => c.name);
  }

  async getSchema(datasetName: string): Promise<DatasetSchema> {
    if (!this.client) await this.connect();

    // MongoDB is schemaless, but we can infer schema from a sample
    const collection = this.client!.db().collection(datasetName);
    const sampleDoc = await collection.findOne();
    
    if (!sampleDoc) return { fields: [] };

    const schema: DatasetSchema = {
      fields: Object.keys(sampleDoc).map(key => ({
        name: key,
        type: typeof sampleDoc[key] === 'number' ? 'NUMBER' : 
              typeof sampleDoc[key] === 'boolean' ? 'BOOLEAN' : 
              sampleDoc[key] instanceof Date ? 'DATE' : 'STRING'
      }))
    };

    return schema;
  }

  async *readData(datasetName: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown> {
    if (!this.client) await this.connect();
    
    const collection = this.client!.db().collection(datasetName);
    const cursor = collection.find(); // You can add chunking with limit/skip
    
    const docs = await cursor.toArray();
    yield docs;
  }

  async writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void> {
    if (!this.client) await this.connect();
    
    const collection = this.client!.db().collection(datasetName);
    if (data.length > 0) {
      await collection.insertMany(data);
    }
  }
}
