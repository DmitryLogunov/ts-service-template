import { get, map, remove } from 'lodash';
import stackTrace from 'stack-trace';
import { logger } from '../../lib';
import { IFilters, IJsonApi, IKeyValue } from '../../types/helpers';
import {
  IRelationships,
  IRelationshipsData,
  IRelationshipsHelper,
  IRelationshipsIncluded,
  IRelationshipsModels,
  IRelationshipsSchema,
  ISchema
} from './../../types/model';

import { getRelationshipTable } from '../../helpers/config';

import { errors, errorTitles } from '../../application-settings';
import ApplicationError from '../../helpers/application-error';

const dictionariesTable = getRelationshipTable('dictionaries');

export default class RelationshipsHelper implements IRelationshipsHelper {
  private schema: ISchema;
  private relationshipsSchema: IRelationshipsSchema;
  private relationshipsData: IRelationshipsData;
  private relationshipsModels: IRelationshipsModels;

  constructor(schema: ISchema, relationshipsModels?: IRelationshipsModels) {
    this.schema = schema;
    this.relationshipsSchema = get(schema, 'relationships');
    this.relationshipsModels = relationshipsModels || {};
    this.relationshipsData = {};
  }

  /**
   * Getter for relationshipsModels
   */
  public getRelationshipsModels(): IRelationshipsModels {
    return this.relationshipsModels;
  }

  /**
   * Getter for relationshipsSchema
   *
   * @returns {ISchema}
   */
  public getSchema(): ISchema {
    return { ...this.schema };
  }

  /**
   * Builds relationships object from data
   *
   * @param {IKeyValue} data
   * @param {string[]?} ctxStateInclude
   * @returns {Promise<IRelationshipsIncluded>}
   */
  public async buildRelationships(data: IKeyValue, ctxStateInclude?: string[]): Promise<IRelationshipsIncluded> {
    if (!this.relationshipsSchema) {
      return;
    }

    const relationships: IRelationships = {};
    const included: IJsonApi[] = [] as IJsonApi[];

    for (const [relationshipTitle, relationshipSection] of Object.entries(this.relationshipsSchema)) {
      let relationshipTable = dictionariesTable;
      if (Object.keys(relationshipSection).includes('relation_table')) {
        relationshipTable = getRelationshipTable(relationshipSection.relation_table);
      }

      let resourceColumn = relationshipTitle;

      // default values for relationship 'type' and 'id': relationshipTable, data[relationshipTitle]
      let relationshipType = relationshipTable;
      let relationshipID = data[relationshipTitle];

      if (Object.keys(relationshipSection).includes('id_column')) {
        // Defining relationship id ...
        if (!Object.keys(data).includes(relationshipSection.id_column)) {
          if (this.isAttributeRequired(relationshipSection.id_column)) {
            const message = `the data is invalid! Not defined required relationship attribute '${
              relationshipSection.id_column
            }'`;
            this.logWarn(message, { relationshipSection, idColumn: relationshipSection.id_column });
            return;
          }
          continue;
        }
        relationshipID = data[relationshipSection.id_column];

        // Defining relationship type ...
        if (!Object.keys(relationshipSection).includes('resource_column')) {
          // if relationship section includes 'id_column', 'table' AND NOT includes 'resource_column'
          //    =>  resource table (type) is the value of relationshipSection.table
          relationshipType = relationshipSection.relation_table;
        }

        if (Object.keys(relationshipSection).includes('resource_column')) {
          resourceColumn = relationshipSection.resource_column;
          if (!Object.keys(data).includes(resourceColumn)) {
            this.logWarn(`the data is invalid! Not defined required relationship attribute '${resourceColumn}'`, {
              relationshipTable,
              resourceColumn
            });
            return;
          }
          if (!Object.keys(relationshipSection).includes('relation_table')) {
            // if relationship section includes 'id_column', 'resource_column' AND NOT includes 'table'
            //    => resource table (type) is the value of data[relationshipSection.resource_column]
            relationshipType = data[resourceColumn];
          }
          if (Object.keys(relationshipSection).includes('relation_table')) {
            // if relationship section includes 'id_column', 'resource_column' and 'relation_table'
            //    => resource table (type) should be got from third party table (from 'relationshipTable')
            if (!Object.keys(this.relationshipsData).includes(relationshipTable)) {
              this.relationshipsData[relationshipTable] = {};
            }
            if (!Object.keys(this.relationshipsData[relationshipTable]).includes(String(data[resourceColumn]))) {
              if (!Object.keys(this.relationshipsModels).includes(relationshipTable)) {
                this.logWarn(`undefined neccessary relashionship model '${relationshipTable}'`, { relationshipTable });
                return;
              }
              const relationshipModelTitleColumn = this.relationshipsModels[relationshipTable].titleColumn;
              const relationshipDataValue = await this.relationshipsModels[relationshipTable].model.getRowByField(
                String(data[resourceColumn])
              );
              if (!relationshipDataValue.status) {
                this.logWarn(`wrong relationship!`, { relationshipTable, relationValue: String(data[resourceColumn]) });
                return;
              }
              this.relationshipsData[relationshipTable][String(data[resourceColumn])] =
                relationshipDataValue.data[0][relationshipModelTitleColumn];
            }
            relationshipType = this.relationshipsData[relationshipTable][String(data[resourceColumn])];
          }
        }
      }

      relationships[relationshipTitle] = relationshipID
        ? {
            data: {
              id: String(relationshipID),
              type: relationshipType
            }
          }
        : { data: null };

      if (!relationships[relationshipTitle].data || !ctxStateInclude) {
        continue;
      }

      // includes ....
      for (const relationshipInclude of ctxStateInclude) {
        const [relationshipIncludeTitle, relationshipIncludeResource] = [...relationshipInclude.split('.')];

        if (relationshipTitle !== relationshipIncludeTitle) {
          continue;
        }

        let relationshipResource = relationshipIncludeResource;
        if (!relationshipResource && !this.relationshipsSchema[relationshipTitle].resource_column) {
          relationshipResource = this.relationshipsSchema[relationshipTitle].relation_table || 'dictionaries';
        }

        const relationshipResourceTable = getRelationshipTable(relationshipType);
        const attributes: IKeyValue = this.parseIncludedRelationshipAttributes(
          data,
          ctxStateInclude,
          relationshipInclude,
          relationshipResourceTable
        );

        if (!attributes || !Object.keys(attributes).length || Object.keys(attributes).length === 0) {
          continue;
        }

        const notNullAttributes = remove(Object.values(attributes), (attributeValue: string | null) => attributeValue);
        if (Object.keys(notNullAttributes).length === 0) {
          continue;
        }

        included.push({
          attributes,
          id: String(relationshipID),
          links: {
            self: `/${relationshipType}/${relationshipID}`
          },
          type: relationshipType
        });
      }
    }

    return { relationships, included };
  }

  /**
   * Parses data and returns relationships object
   *
   * @param {IRelationships} relationships
   * @returns {Promise<IKeyValue>}
   */
  public async parseRelationships(relationships: IRelationships): Promise<IKeyValue> {
    const data: IKeyValue = {};
    for (const [relationshipTitle, relationshipSection] of Object.entries(this.relationshipsSchema)) {
      if (!Object.keys(relationships).includes(relationshipTitle)) {
        this.logWarn(`the relationships data is invalid! Not defined required relationship section`, {
          relationshipTitle
        });
        continue;
      }

      // The simplest case - there is only columnID relationship
      // Default values for relationship columnID 'title' and 'id': relationshipTitle, relashionships[relationshipTitle].data.id
      let idColumnTitle = relationshipTitle;
      const idColumnValue = relationships[relationshipTitle].data.id;

      if (Object.keys(relationshipSection).includes('id_column')) {
        // Defining relationship columnID ...
        idColumnTitle = relationshipSection.id_column;

        // Defining relationship columnResource if it necessary ...
        if (Object.keys(relationshipSection).includes('resource_column')) {
          const resourceColumnTitle = relationshipSection.resource_column;

          // As default columnResourceValue = relashionships[relationshipTitle].data.type
          // (if there is NOT defined relationshipSection.relation_table)
          let resourceColumnValue = relationships[relationshipTitle].data.type;

          if (Object.keys(relationshipSection).includes('relation_table')) {
            // if relationship section includes 'id_column', 'resource_column' and 'relation_table'
            //    => resource table (type) should be got from third party table (from 'relationshipTable')
            const relationshipTable = getRelationshipTable(relationshipSection.relation_table);
            if (!Object.keys(this.relationshipsModels).includes(relationshipTable)) {
              this.logWarn(`undefined neccessary relashionship model '${relationshipTable}'`, { relationshipTable });
              continue;
            }

            if (!Object.keys(this.relationshipsData).includes(relationshipTable)) {
              this.relationshipsData[relationshipTable] = {};
            }

            const resourceTitle = relationships[relationshipTitle].data.type;
            resourceColumnValue = null;
            for (const [key, value] of Object.entries(this.relationshipsData[relationshipTable])) {
              if (resourceTitle === value) {
                resourceColumnValue = key;
              }
            }

            if (!resourceColumnValue) {
              const relationshipModelTitleColumn = this.relationshipsModels[relationshipTable].titleColumn;
              const relationshipDataValue = await this.relationshipsModels[relationshipTable].model.getRowByField(
                resourceTitle,
                relationshipModelTitleColumn
              );

              resourceColumnValue = get(relationshipDataValue, 'data[0].id');
              if (!resourceColumnValue) {
                this.logWarn(`wrong relationship!`, {
                  relationColumn: relationshipModelTitleColumn,
                  relationValue: resourceTitle,
                  relationshipTable
                });

                throw new ApplicationError(
                  errors.CUSTOM_ERROR_RESPONSE('relationships not found', 404, errorTitles[404])
                );
              }

              this.relationshipsData[relationshipTable][resourceColumnValue] = resourceTitle;
            }
          }
          if (resourceColumnValue) {
            data[resourceColumnTitle] = String(resourceColumnValue);
          }
        }
      }
      if (idColumnValue) {
        data[idColumnTitle] = String(idColumnValue);
      }
    }

    return data;
  }

  /**
   * Builds and returns 'filters' section from schema.relationships
   *
   * @returns {Promise<IFilters>}
   */
  public async getFiltersFromSchema(): Promise<IFilters> {
    if (!this.relationshipsSchema) {
      return {};
    }

    const filters: IFilters = {};

    for (const [relationshipTitle, relationshipSection] of Object.entries(this.relationshipsSchema)) {
      const relationshipSectionKeys = Object.keys(relationshipSection);

      if (relationshipSectionKeys.length === 0 || !relationshipSectionKeys.includes('id_column')) {
        const relationshipTitleParts = relationshipTitle.split('_');
        if (relationshipTitleParts[relationshipTitleParts.length - 1] === 'id') {
          const relationshipTitlePrefix = relationshipTitleParts.slice(0, relationshipTitleParts.length - 1).join('_');
          filters[`${relationshipTitlePrefix}.id`] = { column: `${relationshipTitlePrefix}_id` };
        }
        continue;
      }

      const idColumnTitle = relationshipSection.id_column;
      filters[`${relationshipTitle}.id`] = { column: `${idColumnTitle}` };

      if (!relationshipSectionKeys.includes('resource_column')) {
        const relationshipTable = getRelationshipTable(relationshipSection.relation_table);
        if (this.relationshipsModels[relationshipTable]) {
          const relashionshipSchema = this.relationshipsModels[relationshipTable].model.getSchema();
          const relashionshipSchemaAttributes = get(relashionshipSchema, 'attributes');
          if (!this.checkArray(relashionshipSchemaAttributes)) {
            continue;
          }

          // filters <relationship_title>.<relationship_resource_attribute>:
          // by attributes of simple relationships (with known single relationship resource)
          for (const relationshipAttribute of relashionshipSchemaAttributes) {
            filters[`${relationshipTitle}.${relationshipAttribute}`] = {
              column: `${idColumnTitle}`,
              referenceJoinColumn: 'id',
              referenceQueryColumn: relationshipAttribute,
              referenceTable: relationshipSection.relation_table
            };
          }
        }
        continue;
      }

      if (relationshipSectionKeys.includes('resource_column')) {
        const resourceColumnTitle = relationshipSection.resource_column;
        const resourceIDColumn = relationshipSection.id_column;

        if (!relationshipSectionKeys.includes('relation_table')) {
          filters[`${relationshipTitle}.type`] = {
            column: `${resourceColumnTitle}`
          };
          continue;
        }

        if (relationshipSectionKeys.includes('relation_table')) {
          // filter <relationship_title>.id: by complex relationships (by context resource from 'dictionaries')
          filters[`${relationshipTitle}_type.id`] = { column: `${resourceColumnTitle}` };

          const relationshipTable = getRelationshipTable(relationshipSection.relation_table) || dictionariesTable;
          if (!this.checkRelationshipTable(relationshipTable)) {
            continue;
          }

          // filter <relationship_title>.type: by complex relationships (by context resource from 'dictionaries')
          filters[`${relationshipTitle}.type`] = {
            column: resourceColumnTitle,
            referenceJoinColumn: 'id',
            referenceQueryColumn: this.relationshipsModels[relationshipTable].titleColumn,
            referenceTable: relationshipSection.relation_table
          };

          // filters <relationship_title>.<relationship_resource>.<relationship_resource_attribute>:
          // by complex relationships attributes (with context resource from 'dictionaries')
          const relationshipResourceTitles = await this.getRelationshipsResourcesTitles(relationshipTable);

          for (const relationshipResourceTitle of relationshipResourceTitles) {
            const relationshipResourceTable = getRelationshipTable(relationshipResourceTitle);
            if (Object.keys(this.relationshipsModels).includes(relationshipResourceTable)) {
              const relashionshipSchema = this.relationshipsModels[relationshipResourceTable].model.getSchema();
              const relashionshipSchemaAttributes = get(relashionshipSchema, 'attributes');
              if (!this.checkArray(relashionshipSchemaAttributes)) {
                continue;
              }

              for (const relationshipAttribute of relashionshipSchemaAttributes) {
                filters[`${relationshipTitle}.${relationshipResourceTitle}.${relationshipAttribute}`] = {
                  column: resourceIDColumn,
                  referenceJoinColumn: 'id',
                  referenceQueryColumn: relationshipAttribute,
                  referenceTable: relationshipResourceTable
                };
              }
            }
          }
        }
      }
    }

    return filters;
  }

  /**
   * Returns available values for query parameter 'include' (relationships with described models and schemas)
   *
   * @returns {Promise<string[]>}
   */
  public async getAvailableIncludes(): Promise<string[]> {
    const availableIncludes = [];
    for (const relashionshipTitle of Object.keys(this.relationshipsSchema)) {
      const relationshipTableAlias =
        get(this.relationshipsSchema[relashionshipTitle], 'relation_table') || 'dictionaries';
      const relationshipTable = getRelationshipTable(relationshipTableAlias);
      if (!this.checkRelationshipTable(relationshipTable)) {
        continue;
      }

      if (Object.keys(this.relationshipsSchema[relashionshipTitle]).includes('resource_column')) {
        const relationshipResourceTitles = await this.getRelationshipsResourcesTitles(relationshipTable);
        for (const relationshipResourceTitle of relationshipResourceTitles) {
          const relationshipResourceTable = getRelationshipTable(relationshipResourceTitle);
          if (Object.keys(this.relationshipsModels).includes(relationshipResourceTable)) {
            availableIncludes.push(`${relashionshipTitle}.${relationshipResourceTitle}`);
          }
        }
        continue;
      }

      if (Object.keys(this.relationshipsModels).includes(relationshipTable)) {
        availableIncludes.push(relashionshipTitle);
      }
    }
    return availableIncludes;
  }

  /**
   * Return titles of relationships resources
   *
   * @param {string} relationshipTable
   * @returns {Promise<string[]> }
   */
  private async getRelationshipsResourcesTitles(relationshipTable: string): Promise<string[]> {
    const resourceTypeDictionaryFilter = [{ field: 'type', operand: 'eq', values: ['resource_type'] }];
    const relationshipModel = this.relationshipsModels[relationshipTable].model;
    const relationshipResourceTitlesDBResult = await relationshipModel.getByParams(resourceTypeDictionaryFilter);
    const relashionshipTitleColumn = this.relationshipsModels[relationshipTable].titleColumn;
    const relationshipResourceTitles = map(
      relationshipResourceTitlesDBResult.data,
      (dbResultItem: IKeyValue) => dbResultItem[relashionshipTitleColumn]
    );

    return relationshipResourceTitles;
  }

  /**
   * Return parsed attributes of included relationship data
   *
   * @param {IKeyValue} data
   * @param {string[]} ctxStateInclude
   * @param {string} relationshipInclude
   * @param {string} relationshipTable
   * @returns {IKeyValue}
   */
  private parseIncludedRelationshipAttributes(
    data: IKeyValue,
    ctxStateInclude: string[],
    relationshipInclude: string,
    relationshipTable: string
  ): IKeyValue {
    const attributes: IKeyValue = {};
    if (ctxStateInclude && ctxStateInclude.includes(relationshipInclude)) {
      const relationshipModel = get(this.relationshipsModels, relationshipTable);
      if (!relationshipModel) {
        this.logWarn(`undefined neccessary relationship model of included resource '${relationshipTable}'`, {
          relationshipInclude,
          relationshipTable
        });
        return attributes;
      }

      const relationshipModelSchema = relationshipModel.model.getSchema();
      if (!relationshipModelSchema || !this.checkArray(relationshipModelSchema.attributes)) {
        this.logWarn(`undefined relationship model attributes of included resource '${relationshipTable}'`, {
          relationshipInclude,
          relationshipTable
        });
        return attributes;
      }

      const [relationshipTitle, relationshipIncludeResource] = [...relationshipInclude.split('.')];

      let relationshipResource = relationshipIncludeResource;
      if (!relationshipResource && !this.relationshipsSchema[relationshipTitle].resource_column) {
        relationshipResource = this.relationshipsSchema[relationshipTitle].relation_table || 'dictionaries';
      }

      const re = new RegExp(`^_${relationshipTitle}_${relationshipResource}_\\w+$`);
      const relationshipAttributes = remove(Object.keys(data), (relAttribute: string) => re.test(relAttribute));
      for (const key of relationshipAttributes) {
        if (key === `_${relationshipTitle}_${relationshipResource}_id`) {
          continue;
        }
        const relationshipKey = key.replace(`_${relationshipTitle}_${relationshipResource}_`, '');
        if (relationshipModelSchema.attributes && relationshipModelSchema.attributes.includes(relationshipKey)) {
          attributes[relationshipKey] = data[key] ? String(data[key]) : null;
        }
      }
    }

    return attributes;
  }

  /**
   * Checks if the relationship table has correct model in this.relationshipsModels
   *
   * @param {string} relationshipTable
   * @returns {boolean}
   */
  private checkRelationshipTable(relationshipTable: string): boolean {
    return (
      Object.keys(this.relationshipsModels).includes(relationshipTable) &&
      Object.keys(this.relationshipsModels[relationshipTable]).includes('model') &&
      typeof this.relationshipsModels[relationshipTable].model.getByParams === 'function'
    );
  }

  /**
   * Checks if 'arr' is a correct array
   *
   * @param {string[]} arr
   * @returns {boolean}
   */
  private checkArray(arr: string[]): boolean {
    return arr && Array.isArray(arr) && arr.length > 0;
  }

  /**
   * Checks if attribute is required
   *
   * @param {string} attribute
   * @returns {boolean}
   */
  private isAttributeRequired(attribute: string): boolean {
    return this.schema.required && this.schema.required.length && this.schema.required.includes(attribute);
  }

  /**
   * Puts out warning log
   *
   * @param {string} message
   * @param {object} params
   */
  private logWarn(message: string, params: object) {
    logger.warn(`Warning Helper#getRelationship : '${message}'`, params, stackTrace.get());
  }
}
