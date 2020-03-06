import { concat, get } from 'lodash';
import { ICtxState, IJsonApi, IKeyValue, IResponseJsonApi, IResponseJsonApiItem } from '../../types/helpers';
import { IRelationshipsHelper, ISchema } from '../../types/model';

export default class ResponseDataFormatter {
  private schema: ISchema;
  private relationshipsHelper: IRelationshipsHelper;

  constructor(schema: ISchema, relationshipsHelper: IRelationshipsHelper) {
    this.schema = schema;
    this.relationshipsHelper = relationshipsHelper;
  }

  /**
   * Formats an array of data objects to JSON:API
   *
   * @param data
   * @returns {IJsonApi[]}
   */

  public async formatDataToResponse(
    data: IKeyValue[],
    resource: string,
    ctxState?: ICtxState,
    buildRelationships?: boolean,
    isWaitingManyItemsInResult?: boolean
  ): Promise<IResponseJsonApi | null> {
    const responseData: any = { data: [], included: [] };

    if (!data.length) {
      if (!ctxState || !get(ctxState, 'include') || ctxState.include.length === 0) {
        delete responseData.included;
      }
      return responseData;
    }
    if (!Array.isArray(data)) {
      if (!ctxState || !get(ctxState, 'include') || ctxState.include.length === 0) {
        delete responseData.included;
      }
      return responseData;
    }

    const formatedData = await Promise.all(
      data.map(item => this.formatDataItemToJsonApi(item, resource, ctxState, buildRelationships))
    );

    for (const formatedItem of formatedData) {
      responseData.data.push(formatedItem.data);
      responseData.included.push(formatedItem.included);
    }

    if (!ctxState || !get(ctxState, 'include') || ctxState.include.length === 0) {
      delete responseData.included;
    }

    if (!isWaitingManyItemsInResult && responseData.data.length === 1) {
      responseData.data = responseData.data[0];
    }
    return responseData;
  }

  /**
   * Format a data object to JSON:API
   *
   * @param object
   * @returns {IResponseJsonApi}
   */
  private async formatDataItemToJsonApi(
    data: IKeyValue,
    resource: string,
    ctxState?: ICtxState,
    buildRelationships?: boolean
  ): Promise<IResponseJsonApiItem> {
    const id: string = String(data.id || null);
    const responseData: IJsonApi = { id, type: resource };
    let included: IJsonApi[] = [];

    const attributes: IKeyValue = {};

    for (const key in data) {
      if (key === 'id') {
        continue;
      }
      if (this.schema.attributes && this.schema.attributes.includes(key)) {
        attributes[key] = data[key] ? String(data[key]) : null;
        continue;
      }
    }

    if (attributes && Object.keys(attributes).length) {
      responseData.attributes = { ...attributes };
    }

    if (!buildRelationships || buildRelationships) {
      const relations = await this.relationshipsHelper.buildRelationships(data, get(ctxState, 'include'));
      responseData.relationships = relations.relationships;
      if (get(ctxState, 'include') && relations.included) {
        included = concat(included, relations.included);
      }
    }

    return { data: responseData, included };
  }
}
