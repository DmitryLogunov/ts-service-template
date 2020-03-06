import { IDBResult } from './db-client';
import { ICtxState, IDataJsonApi, IFilters, IJsonApi, IKeyValue, IQueryParams } from './helpers';

export interface IBaseModel {
  relationshipsHelper: IRelationshipsHelper;
  getSchema: () => ISchema;
  getAvailableIncludes: () => Promise<string[]>;
  formatDataToResponse: (
    data: any[],
    resource: string,
    ctxState?: ICtxState,
    buildRelationships?: boolean,
    isWaitingManyItemsInResult?: boolean
  ) => Promise<IJsonApi[] | IJsonApi>;
  getByParams: (
    params: IQueryParams[],
    selectionFields?: string,
    ctxState?: ICtxState,
    table?: string
  ) => Promise<IDBResult>;
  getRowByField: (value: string, field?: string, table?: string) => Promise<IDBResult>;
  create: (requestBody: IDataJsonApi, table?: string) => Promise<IDBResult>;
  update: (requestBody: IDataJsonApi, id: string, table?: string) => Promise<IDBResult>;
  delete: (id: string, table?: string) => Promise<IDBResult>;
}

export interface ISchema {
  $schema: string;
  $comment: string;
  $id: string;
  title: string;
  type: string;
  attributes: string[];
  required?: string[];
  relationships?: IRelationshipsSchema;
  properties: object;
}
export interface IRelationshipsSchemaSection {
  relation_table: string;
  resource_column: string;
  id_column: string;
}

export interface IRelationshipsSchema {
  [key: string]: IRelationshipsSchemaSection;
}

export interface IRelationshipsSection {
  attributes?: IKeyValue;
  data: { type: string; id: string };
}

export interface IRelationships {
  [key: string]: IRelationshipsSection;
}

export interface IRelationshipsIncluded {
  relationships: IRelationships;
  included: IJsonApi[];
}
export interface IRelationshipsModels {
  [key: string]: {
    model: IBaseModel;
    titleColumn: string;
  };
}

export interface IKeyValue {
  [key: string]: string;
}
export interface IRelationshipsData {
  [key: string]: IKeyValue;
}

export interface IRelationshipsHelper {
  getRelationshipsModels: () => IRelationshipsModels;
  getSchema: () => ISchema;
  getAvailableIncludes: () => Promise<string[]>;
  buildRelationships: (data: IKeyValue, ctxStateInclude?: string[]) => Promise<IRelationshipsIncluded>;
  parseRelationships: (relationships: IRelationships) => Promise<IKeyValue>;
  getFiltersFromSchema: () => Promise<IFilters>;
}

export interface IModelsDataHelper {
  formatDataToResponse: (
    data: IKeyValue[],
    resource: string,
    ctxState?: ICtxState,
    buildRelationships?: boolean,
    isWaitingManyItemsInResult?: boolean
  ) => Promise<IJsonApi[] | IJsonApi>;
  replaceAttributesKeysToActionTableAliases: (payload: IDataJsonApi) => Promise<IDataJsonApi>;
  splitParams: (params: IQueryParams[]) => [string[], string[]];
  getPrimaryField: () => string;
  limitation: (limit: number, page?: number) => string;
  getPayloadFromQueryParams: (params: IQueryParams[]) => Promise<IKeyValue>;
}
