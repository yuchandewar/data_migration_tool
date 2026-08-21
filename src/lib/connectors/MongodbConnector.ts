import { BaseConnector } from './BaseConnector';
import { DatabaseConnectionConfig, DatasetSchema } from '@/types/migration';
import { MongoClient } from 'mongodb';
import * as dns from 'dns';

export class MongodbConnector extends BaseConnector {
  protected config: DatabaseConnectionConfig;
  private client: MongoClient | null = null;

  constructor(config: DatabaseConnectionConfig) {
    super(config);
    this.config = config as DatabaseConnectionConfig;
  }

  private async buildUri(): Promise<string> {
    if (this.config.connectionUrl) {
      let uri = this.config.connectionUrl;
      // Handle the Node.js / MongoDB driver ENOTFOUND SRV bug automatically
      if (uri.startsWith('mongodb+srv://')) {
        try {
          const parsedUrl = new URL(uri);
          const hostname = parsedUrl.hostname;
          
          const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
          if (srvRecords.length > 0) {
            const txtRecords = await dns.promises.resolveTxt(hostname);
            const txtString = txtRecords.flat().join('');
            
            const auth = parsedUrl.username ? `${parsedUrl.username}:${parsedUrl.password}@` : '';
            const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
            let path = parsedUrl.pathname || '/';
            
            let newUri = `mongodb://${auth}${hosts}${path}?ssl=true`;
            if (txtString) newUri += `&${txtString}`;
            
            parsedUrl.searchParams.forEach((val, key) => {
              if (!newUri.includes(key + '=')) newUri += `&${key}=${val}`;
            });
            
            return newUri;
          }
        } catch (e) {
          // If DNS fails, fallback to the original URI and let the driver try
          console.warn('Auto SRV resolution failed, falling back to original URI', e);
        }
      }
      return uri;
    }
    const auth = this.config.username ? `${this.config.username}:${this.config.password}@` : '';
    return `mongodb://${auth}${this.config.host}:${this.config.port}/${this.config.database}`;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    const uri = await this.buildUri();
    this.client = new MongoClient(uri);
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
      // Check if data contains _id to perform an upsert instead of blind insert
      // This prevents E11000 duplicate key errors if the job is run multiple times
      if (data[0]._id !== undefined) {
        const bulkOps = data.map(doc => {
          // If _id is a string that looks like an ObjectId, we might need to convert it, 
          // but usually the source driver passes it as an ObjectId already.
          return {
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true
            }
          };
        });
        await collection.bulkWrite(bulkOps);
      } else {
        await collection.insertMany(data);
      }
    }
  }
}
