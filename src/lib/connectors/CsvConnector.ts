import { BaseConnector } from './BaseConnector';
import { CsvConnectionConfig, DatasetSchema } from '@/types/migration';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';

export class CsvConnector extends BaseConnector {
  protected config: CsvConnectionConfig;

  constructor(config: CsvConnectionConfig) {
    super(config);
    this.config = config as CsvConnectionConfig;
  }

  async connect(): Promise<void> {
    if (this.config.filePath && !fs.existsSync(this.config.filePath)) {
      throw new Error(`File or directory not found: ${this.config.filePath}`);
    }
  }

  async disconnect(): Promise<void> {}

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }

  async listDatasets(): Promise<string[]> {
    if (!this.config.filePath) return [];
    try {
      const stats = fs.statSync(this.config.filePath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(this.config.filePath);
        return files.filter(f => f.endsWith('.csv') || f.endsWith('.json'));
      } else {
        return [path.basename(this.config.filePath)];
      }
    } catch {
      return [];
    }
  }

  private getActualFilePath(datasetName?: string): string {
    if (!this.config.filePath) throw new Error('No file path provided');
    const stats = fs.statSync(this.config.filePath);
    if (stats.isDirectory() && datasetName) {
      return path.join(this.config.filePath, datasetName);
    }
    return this.config.filePath;
  }

  async getSchema(datasetName?: string): Promise<DatasetSchema> {
    return new Promise((resolve, reject) => {
      try {
        const filePath = this.getActualFilePath(datasetName);
        const fileStream = fs.createReadStream(filePath);
        
        Papa.parse(fileStream, {
          header: true,
          preview: 1,
          complete: (results) => {
            if (!results.meta.fields) {
              return reject(new Error('Could not parse headers'));
            }
            
            const schema: DatasetSchema = {
              fields: results.meta.fields.map(field => ({
                name: field,
                type: 'STRING'
              }))
            };
            resolve(schema);
          },
          error: (error: any) => reject(error)
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async *readData(datasetName?: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown> {
    const filePath = this.getActualFilePath(datasetName);
    // Implementing a basic mock generator for now.
    yield [{ mockData: `reading from ${filePath}` }];
  }

  async writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void> {
    const filePath = this.getActualFilePath(datasetName);
    console.log(`Writing ${data.length} rows to CSV ${filePath}`);
  }
}
