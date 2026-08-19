export type ConnectorType = 'CSV' | 'POSTGRES' | 'MYSQL' | 'MONGODB' | 'API';

export interface BaseConnectionConfig {
  id: string;
  name: string;
  type: ConnectorType;
}

export interface DatabaseConnectionConfig extends BaseConnectionConfig {
  type: 'POSTGRES' | 'MYSQL' | 'MONGODB';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionUrl?: string;
}

export interface CsvConnectionConfig extends BaseConnectionConfig {
  type: 'CSV';
  filePath?: string; // For local/uploaded files
  url?: string;      // For remote files
  delimiter?: string;
}

export interface ApiConnectionConfig extends BaseConnectionConfig {
  type: 'API';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  authType?: 'NONE' | 'BEARER' | 'BASIC';
  token?: string;
}

export type ConnectionConfig = 
  | DatabaseConnectionConfig 
  | CsvConnectionConfig 
  | ApiConnectionConfig;

export type DataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'OBJECT' | 'ARRAY';

export interface SchemaField {
  name: string;
  type: DataType;
  required?: boolean;
  description?: string;
}

export interface DatasetSchema {
  fields: SchemaField[];
}

export type TransformationRuleType = 'RENAME_COLUMN' | 'CAST_TYPE' | 'FILTER_ROW' | 'CUSTOM_SCRIPT' | 'DROP_COLUMN';

export interface TransformationRule {
  id: string;
  type: TransformationRuleType;
  config: Record<string, any>; // e.g., { sourceColumn: 'old', targetColumn: 'new' }
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface MigrationJob {
  id: string;
  name: string;
  sourceConfigId: string;
  destinationConfigId: string;
  transformationRules: TransformationRule[];
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}
