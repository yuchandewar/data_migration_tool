import { ConnectionConfig, DatasetSchema } from '@/types/migration';

/**
 * Base abstract class for all data connectors.
 * Connectors are responsible for reading from and writing to specific data sources.
 */
export abstract class BaseConnector {
  protected config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  /**
   * Initializes the connection to the data source.
   */
  abstract connect(): Promise<void>;

  /**
   * Closes the connection to the data source.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Tests if the connection is valid and accessible.
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Lists available datasets (tables, collections) in the connection.
   */
  abstract listDatasets(): Promise<string[]>;

  /**
   * Infers or retrieves the schema of the dataset.
   * @param datasetName - The name of the table, collection, or file
   */
  abstract getSchema(datasetName?: string): Promise<DatasetSchema>;

  /**
   * Reads data from the source.
   * @param datasetName - The name of the table, collection, or file
   * @param options - Additional options like limit, offset, filters
   */
  abstract readData(datasetName?: string, options?: Record<string, any>): AsyncGenerator<any[], void, unknown>;

  /**
   * Writes data to the destination.
   * @param datasetName - The name of the table, collection, or file
   * @param data - Array of records to write
   * @param options - Additional options like upsert, overwrite
   */
  abstract writeData(datasetName: string, data: any[], options?: Record<string, any>): Promise<void>;
}
