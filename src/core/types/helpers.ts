export interface IPaginationLinks {
  self: string;
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

export interface IJsonApi {
  id?: string;
  type: string;
  attributes?: any;
  relationships?: any;
  links?: any;
  included?: any;
}

export interface IDataJsonApi {
  data: IJsonApi;
}

export interface IResponseJsonApi {
  data: IJsonApi | IJsonApi[];
  included?: IJsonApi[];
}

export interface IResponseJsonApiItem {
  data: IJsonApi;
  included?: IJsonApi[];
}

export interface IQueryParams {
  field: string;
  operand: string;
  values: string[];
}
export interface IKeyValue {
  [key: string]: string;
}

export interface IQueryWhere {
  delimiter?: string;
  template: string;
  values: string[];
}

export interface IQueryJoin {
  tableAlias: string;
  column: string;
  referenceTable: string;
  referenceTableAlias: string;
  referenceColumn: string;
}

export interface IQuery {
  table: string;
  where: IQueryWhere;
  joins: string[];
  order?: string;
  selectionFields?: string[];
}

export interface IFilters {
  [key: string]: {
    column: string;
    referenceTable?: string;
    referenceJoinColumn?: string;
    referenceQueryColumn?: string;
  };
}

export interface IQueryByAttributes {
  [key: string]: {
    aliases?: IKeyValue;
    wheres: IQueryWhere[];
    join?: string;
  };
}

export interface ICtxState {
  id?: string;
  body?: IDataJsonApi;
  payload?: IKeyValue;
  limit?: number;
  page?: number;
  sort?: string;
  include?: string[];
  fields?: string[];
  query?: IKeyValue;
}

export interface IAttributeQueryParams {
  filterAttributeTitle: string;
  attributeTitle: string;
  attributeOperand: string;
  attributeValues: string[];
  delimiter: string;
  mainQueryTable: string;
}

export interface IIncludedRelationshipsQueryParts {
  includedSelectionFields: string[];
  includedJoins: string[];
}
