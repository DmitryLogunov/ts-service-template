import { each, get } from 'lodash';
import { ITables } from '../../types/config';
import { IFilters, IKeyValue, IQueryParams } from '../../types/helpers';
import { IRelationshipsHelper, ISchema } from '../../types/model';

export default class DataHelper {
  private schema: ISchema;
  private relationshipsHelper: IRelationshipsHelper;
  private relationshipsFiltersFromSchema: IFilters;
  private relationshipsTitlesFiltersFromSchema: string[];
  private mainTable: string;

  constructor(schema: ISchema, tables: ITables, relationshipsHelper: IRelationshipsHelper) {
    this.schema = schema;
    this.relationshipsHelper = relationshipsHelper;
    this.relationshipsFiltersFromSchema = null;
    this.relationshipsTitlesFiltersFromSchema = [];
    this.mainTable = tables ? tables.mainTable : null;
  }

  /**
   * Replaces keys with them aliases in payload
   *
   * @param {IKeyValue} payload
   * @returns {IKeyValue}
   */
  public replacePropertiesToAliases(payload: IKeyValue): IKeyValue {
    const newPayload: IKeyValue = {};

    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        const aliasasKey: string = get(this.schema, `properties[${key}].alias.field_name`);
        if (aliasasKey) {
          newPayload[aliasasKey] = payload[key];
        }
      }
    }

    return newPayload;
  }

  /**
   * Replaces keys with them aliases in payload
   *
   * @param {IKeyValue} payload
   * @returns {IKeyValue}
   */
  public replaceAliasesToProperties(payload: IKeyValue): IKeyValue {
    const newPayload: IKeyValue = {};

    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        each(this.schema.properties, (fieldData: any, fieldTitle: string) => {
          if (get(fieldData, 'alias.field_name') === key) {
            newPayload[fieldTitle] = payload[key];
          }
        });
      }
    }

    return newPayload;
  }

  /**
   * Returns 'payload' (IKeyValue) builded from 'queryParams' (IQueryParams[])
   *
   * @param {IQueryParams[]} params
   * @returns {IKeyValue}
   */
  public async getPayloadFromQueryParams(params: IQueryParams[]): Promise<IKeyValue> {
    const payload: IKeyValue = {};

    if (!this.relationshipsFiltersFromSchema) {
      this.relationshipsFiltersFromSchema = await this.relationshipsHelper.getFiltersFromSchema();
      this.relationshipsTitlesFiltersFromSchema = Object.keys(this.relationshipsFiltersFromSchema);
    }

    for (const paramsItem of params) {
      let fieldTitle = paramsItem.field;

      if (this.relationshipsTitlesFiltersFromSchema.includes(fieldTitle)) {
        if (!Object.keys(this.relationshipsFiltersFromSchema[fieldTitle]).includes('referenceTable')) {
          fieldTitle = this.relationshipsFiltersFromSchema[fieldTitle].column;
        } else {
          continue;
        }
      }

      payload[fieldTitle] = paramsItem.values[0];
    }

    return payload;
  }

  /**
   * Returns the limitation in SQL format (such as 'LIMIT start, limit')
   *
   * @param {number} limit
   * @param {number?} page
   * @returns {string}
   */
  public getLimitation(limit: number, page: number = 0): string {
    const limits = page >= 0 ? `LIMIT ${limit * page}, ${limit}` : '';
    return limits;
  }

  /**
   * Return object as { id: 'ASC', title: 'DESC' }
   *
   * @param {string[] | string = []} params
   * @returns {IKeyValue}
   */
  public getSorting(params: string[] | string): { keys: string[]; condition: IKeyValue } {
    const result: { condition: IKeyValue; keys: string[] } = { keys: [], condition: {} };

    const iterableParams = this.getIterableValues(params);

    for (const key of iterableParams) {
      let sortKey = null;
      let operand = null;

      if (key[0] === '-') {
        sortKey = key.slice(1);
        operand = 'DESC';
      } else {
        sortKey = key;
        operand = 'ASC';
      }

      const chainTable = this.mainTable.concat('.', sortKey);
      const dbKey = chainTable
        .split('.')
        .map((part: string) => `\`${part}\``)
        .join('.');

      result.condition[dbKey] = operand;
      result.keys.push(sortKey);
    }

    return result;
  }

  /**
   * Returns params into iterable values
   *
   * @param {string | string[]} values
   * @returns {string[]}
   */
  private getIterableValues(values: string | string[]): string[] {
    if (values && !values.length) {
      return [];
    }

    return Array.isArray(values) ? values.join(',').split(',') : String(values).split(',');
  }
}
