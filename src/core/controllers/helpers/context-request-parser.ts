import { get, merge } from 'lodash';
import { operands } from '../../application-settings';
import { IDataJsonApi, IKeyValue, IQueryParams } from '../../types/helpers';
import { IRelationshipsHelper } from '../../types/model';

import { errors } from '../../application-settings';
import ApplicationError from '../../helpers/application-error';

export default class ContextRequestParser {
  private relationshipsHelper: IRelationshipsHelper;

  constructor(relationshipsHelper: IRelationshipsHelper) {
    this.relationshipsHelper = relationshipsHelper;
  }

  /**
   * Parses object from JSON:API data format to <key:value> Object
   *
   * @param data - ctx.request.body
   * @returns {IKeyValue}
   */
  public async parseBody(data: IDataJsonApi): Promise<IKeyValue> {
    const attributes = get(data, 'data.attributes');
    const payload = { ...attributes };

    const relationships = get(data, 'data.relationships');
    if (relationships) {
      const relationshipsPayload = await this.relationshipsHelper.parseRelationships(relationships);
      merge(payload, relationshipsPayload);
    }

    return payload;
  }

  /**
   * Transform querystring from client to IQueryParams[]
   *
   * @param {IKeyValue} params
   * @returns {IQueryParams[]}
   */
  public parseParams(params: IKeyValue): IQueryParams[] {
    const filter: IQueryParams[] = [];

    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const [field, operandFromClient] = this.getProps(key);
        if (!field || !operandFromClient) {
          continue;
        }

        const valueByFilter = params[key];
        const values = Array.isArray(valueByFilter) ? [...valueByFilter] : [valueByFilter];
        const operand = values.length === 1 ? operandFromClient : operandFromClient === 'eq' ? 'in' : 'nin';

        filter.push({ field, operand, values });
      }
    }

    return filter;
  }

  /**
   * Check querystring by this.regex and returns key and value
   *
   * @param {string} queryString
   * @returns {string[]}
   */
  private getProps(queryString: string): string[] {
    const filtersRegexp = /^filter\[(.+?)\](\[(.+?)\])?$/;
    const keys = queryString.match(filtersRegexp);
    if (!keys) {
      throw new ApplicationError(errors.INVALID_QUERY_PARAMETER(queryString));
    }

    const result = [keys[1], keys[3] || 'eq'];
    if (!Object.keys(operands).includes(result[1])) {
      throw new ApplicationError(errors.INVALID_QUERY_OPERAND(result[1]));
    }

    return result;
  }
}
