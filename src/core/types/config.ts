export interface IDBSettings {
  host: string;
  user: string;
  password: string;
  port: number;
  connectionLimit: number;
}

export interface ILogSettings {
  level: string;
  format: number;
  colorize: boolean;
  transports?: string;
  filename?: string;
}

export interface ITables {
  mainTable: string;
  actionTable?: string;
}

export interface IResource {
  name: string;
  prefix: string;
  methods: string[];
  tables: ITables;
}

export interface IRelationshipTable {
  name: string;
  table: string;
}

export interface IAwsSettings {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface IConfig {
  port: number;
  version?: string;
  label: string;
  fileField: string;
  resource: string;
  reqGuidHeader: string;
  defaultLimit: number;
  logSettings: ILogSettings;
  dbSettings: IDBSettings;
  relationships: IRelationshipTable[];
  resources: IResource[];
  awsSettings: IAwsSettings;
}

export interface IResourceSettings {
  controller: any;
  model: any;
  relationshipModels?: any;
}

export interface IResourcesSettings {
  [key: string]: IResourceSettings;
}
