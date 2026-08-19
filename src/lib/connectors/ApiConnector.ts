import { BaseConnector } from './BaseConnector';
import { ApiConnectionConfig, DatasetSchema } from '@/types/migration';
import axios, { AxiosInstance } from 'axios';

export class ApiConnector extends BaseConnector {
  protected config: ApiConnectionConfig;
  private client: AxiosInstance;

  constructor(config: ApiConnectionConfig) {
    super(config);
    this.config = config as ApiConnectionConfig;
    
    const headers = { ...this.config.headers };
    if (this.config.authType === 'BEARER' && this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers
    });
  }

  async connect(): Promise<void> {
    // API is stateless, no persistent connection needed
  }

  async disconnect(): Promise<void> {
    // API is stateless
  }

  async testConnection(): Promise<boolean> {
    try {
      // Trying a simple GET or HEAD request to verify endpoint is accessible
      await this.client.request({ method: this.config.method || 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async listDatasets(): Promise<string[]> {
    return []; // APIs usually expose a single dataset per configured endpoint
  }

  async getSchema(datasetName?: string): Promise<DatasetSchema> {
    // Inferring schema from API response
    const response = await this.client.request({ method: this.config.method || 'GET' });
    const data = response.data;
    
    // Assume data is an array of objects
    const sample = Array.isArray(data) ? data[0] : data;

    if (!sample || typeof sample !== 'object') return { fields: [] };

    return {
      fields: Object.keys(sample).map(key => ({
        name: key,
        type: typeof sample[key] === 'number' ? 'NUMBER' : 
              typeof sample[key] === 'boolean' ? 'BOOLEAN' : 'STRING'
      }))
    };
  }

  async *readData(datasetName?: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown> {
    const response = await this.client.request({ method: this.config.method || 'GET' });
    let data = response.data;
    
    // Normalize to array
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    yield data;
  }

  async writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void> {
    // Sending data to API
    await this.client.request({
      method: 'POST', // Usually POST for writing data
      data
    });
  }
}
