import Ajv from 'ajv';
import ajvError from 'better-ajv-errors';
import fs from 'fs';
import { findKey, get } from 'lodash';
import stackTrace from 'stack-trace';

import { DBClient, logger } from '../lib';
import DataHelper from './helpers/data-helper';
import RelationshipsHelper from './helpers/relationships-helper';
import SqlQueryBuilder from './helpers/sql-query-builder';

import { ITables } from '../types/config';
import { IDBClient, IDBResult } from '../types/db-client';
import { ICtxState, IKeyValue, IQueryParams } from './../types/helpers';
import { IRelationshipsHelper, IRelationshipsModels, ISchema } from './../types/model';

import { errors } from '../application-settings';
import ApplicationError from '../helpers/application-error';

const { defaultLimit } = global.config;

export default class BaseModel {
  public relationshipsHelper: IRelationshipsHelper;

  protected dbClient: IDBClient;
  protected schemaPath: string;
  protected mainTable: string;
  protected actionTable: string;
  protected primaryField: string;
  protected primaryActionField: string;

  protected dataHelper: DataHelper;
  protected sqlQueryBuilder: SqlQueryBuilder;

  private limit: number;
  private schema: ISchema;

  private validator: any;
  private propsOfSchema: string[];

  constructor(
    tables: ITables,
    relationshipsModels?: IRelationshipsModels,
    schemaPath?: string,
    limit?: number,
    dbClient?: DBClient
  ) {
    this.dbClient = dbClient || global.dbClient;
    this.schemaPath = schemaPath;
    this.mainTable = tables.mainTable;
    this.actionTable = tables.actionTable || tables.mainTable;
    this.limit = limit || defaultLimit;

    this.initModel(tables, relationshipsModels);
  }

  /**
   * Returns the schema
   *
   * @returns {ISchema}
   */
  public getSchema(): ISchema {
    if (!this.schema) {
      const schemaData = fs.readFileSync(this.schemaPath, 'utf-8');
      this.schema = JSON.parse(schemaData);
    }

    return { ...this.schema };
  }

  /**
   * Returns the rows of 'readTable' filtered by params
   * Use only this.readTable
   *
   * @param {IQueryParams[]} params
   * @param {string?} selectFields
   * @param {ctxState?} ICtxState
   * @param {string?} table
   * @returns {Promise<IDBResult> }
   */
  public async getByParams(
    params: IQueryParams[],
    selection?: string,
    ctxState?: ICtxState,
    table?: string
  ): Promise<IDBResult> {
    const { limit, page, sort } = { ...ctxState };

    const payloadToValidations: IKeyValue = await this.dataHelper.getPayloadFromQueryParams(params);
    this.validate(payloadToValidations, 'soft');

    const replaceToAlias = (str: string, qTable: string, toAlias: string) => {
      return str.replace(new RegExp(qTable, 'g'), toAlias);
    };

    const query = await this.sqlQueryBuilder.build(params, selection, ctxState, table || this.mainTable);

    const alias = 'mainTableAlias';
    const { table: queryTable } = query;

    const selectionFields = replaceToAlias(query.selectionFields.join(', '), queryTable, alias);
    const joins = replaceToAlias(query.joins.join(' '), queryTable, alias);
    const where = replaceToAlias(query.where.template, queryTable, alias);
    const sorting = replaceToAlias(this.getSotringString(sort), queryTable, alias);

    const limitation = limit ? this.dataHelper.getLimitation(limit > 0 ? limit : this.limit, page) : '';
    const targetTable = queryTable + ` AS ${alias}`;

    const sql = `SELECT ${selectionFields} FROM ${targetTable} ${joins} ${where} ${sorting} ${limitation}`;
    return this.dbClient.query(sql, query.where.values);
  }

  /**
   * Returns the row of 'readTable' filtered by 'field' and 'value (if 'field' is not defined than it's filtered by primary field)
   * Use only this.readTable
   *
   * @param {string} value
   * @param {string?} field
   * @param {string?} table
   * @returns {Promise<IDBResult>}
   */
  public async getRowByField(value: string, field?: string, table?: string): Promise<IDBResult> {
    const targetTable: string = this.sqlQueryBuilder.formatSQLTable(table || this.mainTable);
    const primaryField = field || this.primaryField;

    const sql = `SELECT * FROM ${targetTable} WHERE \`${primaryField}\`=?`;
    return this.dbClient.query(sql, [value]);
  }

  /**
   * Inserts new row into the this.mainTable
   *
   * @param {IKeyValue} payload
   * @param {string?} table
   * @returns {Promise<IDBResult>}
   */
  public async create(payload: IKeyValue, table?: string): Promise<IDBResult> {
    const targetTable: string = this.sqlQueryBuilder.formatSQLTable(table || this.actionTable);

    this.validate(payload);
    payload = await this.changeKeysToAliasas(payload);

    const [keys, values] = [Object.keys(payload), Object.values(payload)];
    const symbols = '?, '.repeat(keys.length).slice(0, -2);
    const insertKeys = `\`${keys.join('`, `')}\``;

    const sql = `INSERT INTO ${targetTable} (${insertKeys}) VALUES (${symbols})`;
    return this.dbClient.query(sql, values);
  }

  /**
   * Updates the rows filtered by filter
   *
   * @param {IKeyValue} payload
   * @param {string} id
   * @param {string?} table
   * @returns {Promise<IDBResult>}
   */
  public async update(payload: IKeyValue, id: string, table?: string): Promise<IDBResult> {
    const targetTable: string = this.sqlQueryBuilder.formatSQLTable(table || this.actionTable);

    this.validate(payload, 'soft');
    payload = await this.changeKeysToAliasas(payload);

    const [keys, values] = [Object.keys(payload), Object.values(payload)];
    const sets = keys.map(key => `\`${key}\`=?`).join(', ');

    const sql = `UPDATE ${targetTable} SET ${sets} WHERE \`${this.primaryActionField}\`=?`;
    return this.dbClient.query(sql, [...values, id]);
  }

  /**
   * Deletes the rows from 'actionTable' filtered by filter params
   * Use only this.actionTable
   *
   * @param {string} id
   * @param {string?} table
   * @returns {Promise<IDBResult>}
   */
  public async delete(id: string, table?: string): Promise<IDBResult> {
    const targetTable: string = this.sqlQueryBuilder.formatSQLTable(table || this.actionTable);

    const sql = `DELETE FROM ${targetTable} WHERE \`${this.primaryActionField}\`=?`;
    return this.dbClient.query(sql, [id]);
  }

  /**
   * Returns available values for query parameter 'include' (relationships with described models and schemas)
   *
   * @returns {Promise<string[]>}
   */
  public async getAvailableIncludes(): Promise<string[]> {
    return await this.relationshipsHelper.getAvailableIncludes();
  }

  /**
   * Validates payload according to the this.actionTable schema
   *
   * @param {IKeyValue | string[]} payload
   * @param {string?} mode
   * @returns {boolean}
   */
  protected validate(payload: IKeyValue | string[], mode: string = 'strong'): boolean {
    const valid = this.validator[mode](payload);
    if (!valid) {
      const outputErrors: any = ajvError(this.getSchema(), payload, this.validator[mode].errors, { format: 'js' });
      const detail = outputErrors.length && outputErrors[0].error ? outputErrors[0].error.trim() : 'Payload is invalid';
      const errorForLogger = { errors: detail, mode, payload: JSON.stringify(payload) };

      logger.warn('Object is invalid', errorForLogger, stackTrace.get());
      throw new ApplicationError(errors.VALIDATE_ERROR(detail));
    }

    return valid;
  }

  /**
   * Checks if the schema includes keys of payload
   *
   * @param {string[]} keys
   * @returns {boolean}
   */
  protected validateSotringValues(keys: string[]): boolean {
    keys.forEach(key => {
      if (!this.propsOfSchema.includes(key)) {
        throw new ApplicationError(errors.UNKNOWN_SORT_PARAMETER(key));
      }
    });

    return true;
  }

  /**
   * Change keys to aliasas
   *
   * @param {IKeyValue} payload
   * @returns {IKeyValue}
   */
  private async changeKeysToAliasas(payload: IKeyValue): Promise<IKeyValue> {
    if (this.mainTable !== this.actionTable) {
      return this.dataHelper.replacePropertiesToAliases(payload);
    }

    return payload;
  }

  /**
   * Returns sorting string like 'ORDER BY...'
   *
   * @param {string} sort
   * @returns {string}
   */
  private getSotringString(sort: string): string {
    if (sort !== undefined && (Array.isArray(sort) || (typeof sort === 'string' && sort !== ''))) {
      const sorts = this.dataHelper.getSorting(sort);
      this.validate(sorts.keys, 'keys');

      return `ORDER BY ${Object.keys(sorts.condition)
        .map((attribute: string) => `${attribute} ${sorts.condition[attribute]}`)
        .join(', ')}`;
    }
    return '';
  }

  /**
   * Initializes this Model
   *
   * @param {ITables} tables
   * @param {IRelationshipsModels} relationshipsModels
   */
  private initModel(tables: ITables, relationshipsModels: IRelationshipsModels) {
    if (!this.dbClient) {
      logger.error(`Database client is not established!`, null, stackTrace.get());
      process.exit(1);
    }

    const schema = this.getSchema();

    this.relationshipsHelper = new RelationshipsHelper(schema, relationshipsModels);
    this.dataHelper = new DataHelper(schema, tables, this.relationshipsHelper);
    this.sqlQueryBuilder = new SqlQueryBuilder(tables, this.relationshipsHelper);

    this.propsOfSchema = Object.keys(schema.properties);
    this.primaryField = findKey(schema.properties, ['primary', true]) || 'id';
    this.primaryActionField = get(schema, `properties.${this.primaryField}.alias.field_name`, this.primaryField);

    const strongAjv = new Ajv({ schemaId: 'auto', allErrors: true, jsonPointers: true });
    const strongValidator = strongAjv.compile(schema);

    schema.required = [];
    const softAjv = new Ajv({ schemaId: 'auto', allErrors: true, jsonPointers: true });
    const softValidator = softAjv.compile(schema);

    this.validator = {
      keys: this.validateSotringValues.bind(this),
      soft: softValidator,
      strong: strongValidator
    };
  }
}
