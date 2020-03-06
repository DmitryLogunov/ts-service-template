import { chain, concat, findKey, flattenDeep, get, has, includes, isEmpty, isUndefined, map, remove } from 'lodash';
import stackTrace from 'stack-trace';
import { errors, operands } from '../../application-settings';
import { logger } from '../../lib';
import { ITables } from '../../types/config';
import {
  IAttributeQueryParams,
  ICtxState,
  IFilters,
  IIncludedRelationshipsQueryParts,
  IKeyValue,
  IQuery,
  IQueryByAttributes,
  IQueryParams,
  IQueryWhere
} from '../../types/helpers';
import { IRelationshipsHelper } from '../../types/model';

import { getRelationshipTable } from '../../helpers/config';

export default class SqlQueryBuilder {
  private relationshipsHelper: IRelationshipsHelper;
  private relationshipsFiltersFromSchema: IFilters;
  private relationshipsTitlesFiltersFromSchema: string[];
  private tables: ITables;

  constructor(tables: ITables, relationshipsHelper?: IRelationshipsHelper) {
    this.relationshipsHelper = relationshipsHelper;
    this.relationshipsFiltersFromSchema = null;
    this.relationshipsTitlesFiltersFromSchema = [];
    this.tables = tables;
  }

  /**
   * Builds queryDataObject which implements IQuery interface
   *
   * @param {IQueryParams[]} params
   * @param {string?} selection
   * @param {ICtxState?} ctxState
   * @param {string?} table
   * @returns {Promise<IQuery>}
   */
  public async build(
    params: IQueryParams[],
    selection?: string,
    ctxState?: ICtxState,
    table?: string
  ): Promise<IQuery> {
    if (!this.relationshipsFiltersFromSchema && this.relationshipsHelper) {
      this.relationshipsFiltersFromSchema = await this.relationshipsHelper.getFiltersFromSchema();
      this.relationshipsTitlesFiltersFromSchema = this.relationshipsFiltersFromSchema
        ? Object.keys(this.relationshipsFiltersFromSchema)
        : [];
    }

    const { fields, include } = { ...ctxState };
    const mainQueryTable = table || this.tables.mainTable;
    const joins: { [key: string]: [string, string] } = {};

    let selectionFields = this.buildSelectionFields(selection, fields, mainQueryTable);

    const { includedSelectionFields, includedJoins } = await this.getIncludedRelationshipsQueryParts(
      include,
      fields,
      mainQueryTable,
      joins
    );
    selectionFields = concat(selectionFields, includedSelectionFields);

    if (isEmpty(params)) {
      const query = this.emptyQuery();
      query.selectionFields = selectionFields;
      query.joins = includedJoins;
      return query;
    }

    const queryDataObjectByAttributes: IQueryByAttributes = {};

    for (const [_, paramsItem] of Object.entries(params)) {
      const filterTitle = paramsItem.field;
      const { operand: attributeOperand, values: attributeValues } = paramsItem;

      // parsing filters like:
      // -> ?filter[attr1, attr2][like]='val' => ... WHERE attr1 LIKE '%val%' OR attr2 LIKE '%val%'
      // -> ?filter[attr1][gt]='val1'&filter[attr2][lt]=val2 => ...WHERE attr1 > 'val1' AND attr2 < 'val2'
      const filterAttributeTitles = map(filterTitle.split(','), (a: string) => a.trim());
      const delimiter = filterAttributeTitles.length > 1 ? ' OR ' : ' AND ';

      for (const filterAttributeTitle of filterAttributeTitles) {
        let attributeTitle = filterAttributeTitle;

        if (this.checkIfAttributeFilterIsReltionshipFilter(filterAttributeTitle)) {
          attributeTitle = this.relationshipsFiltersFromSchema[filterAttributeTitle].column;
        }

        if (!has(queryDataObjectByAttributes, attributeTitle)) {
          queryDataObjectByAttributes[attributeTitle] = {
            wheres: []
          };
        }

        const attributeQueryParams = {
          attributeOperand,
          attributeTitle,
          attributeValues,
          delimiter,
          filterAttributeTitle,
          mainQueryTable
        };

        if (!this.isAttributeFilterHasRelationships(filterAttributeTitle)) {
          const simpleAttributeQueryWithoutRelationships = this.getAttributeQueryWithoutRelationships(
            attributeQueryParams
          );
          queryDataObjectByAttributes[attributeTitle].wheres.push(simpleAttributeQueryWithoutRelationships.where);
          continue;
        }

        const complexAttributeQueryWithRelationships = await this.getAttributeQueryWithRelationships(
          attributeQueryParams,
          joins
        );
        queryDataObjectByAttributes[attributeTitle].wheres.push(complexAttributeQueryWithRelationships.where);
        if (!queryDataObjectByAttributes[attributeTitle].join && complexAttributeQueryWithRelationships.join) {
          queryDataObjectByAttributes[attributeTitle].join = complexAttributeQueryWithRelationships.join;
        }
      }
    }

    return this.mergeAttributesQueries(queryDataObjectByAttributes, selectionFields, includedJoins, mainQueryTable);
  }

  /**
   * Returns formated table database.table => `database`.`table`
   *
   * @param {string} table
   * @returns {string}
   */
  public formatSQLTable(table: string): string {
    return map(table.split('.'), (tablePart: string) => `\`${tablePart}\``).join('.');
  }

  /**
   * Returns 'where' object for filters without relationships or with simple (not by 'type') relationships filters
   * (wich not requries to join reference table =>  executes same as usual attributes filters)
   *
   * @param {IAttributeQueryParams} attributeQueryParams
   */
  private getAttributeQueryWithoutRelationships(attributeQueryParams: IAttributeQueryParams) {
    let template = '';
    const { attributeTitle, attributeOperand, attributeValues, delimiter, mainQueryTable } = {
      ...attributeQueryParams
    };
    const values = [...attributeValues];

    template = `${this.formatSQLTable(`${mainQueryTable}.${attributeTitle}`)} ${operands[attributeOperand]}`;
    if (includes(['in', 'nin'], attributeOperand)) {
      template = `${template} (${[map(attributeValues, () => '?').join(', ')]})`;
    }

    if (attributeOperand === 'like') {
      template = `${template} ?`;
      values[0] = `%${values[0]}%`;
    }

    if (attributeOperand === 'regexp') {
      template = `${template} ?`;
      values[0] = `${values[0]}`;
    }

    return {
      where: {
        delimiter,
        template,
        values
      }
    };
  }

  /**
   * Reurns filters with complex relationships filters (which requires to join reference table)
   *
   * @param {IAttributeQueryParams} attributeQueryParams
   */
  private async getAttributeQueryWithRelationships(
    attributeQueryParams: IAttributeQueryParams,
    joins: { [key: string]: [string, string] }
  ) {
    let template = '';
    const { filterAttributeTitle, attributeOperand, attributeValues, delimiter, mainQueryTable } = {
      ...attributeQueryParams
    };
    const values = [...attributeValues];

    const referenceTable = getRelationshipTable(
      this.relationshipsFiltersFromSchema[filterAttributeTitle].referenceTable
    );
    const referenceIDColumn = this.relationshipsFiltersFromSchema[filterAttributeTitle].column;
    const referenceJoinColumn = this.relationshipsFiltersFromSchema[filterAttributeTitle].referenceJoinColumn;
    const referenceQueryColumn = this.relationshipsFiltersFromSchema[filterAttributeTitle].referenceQueryColumn;

    let condition = `{{:referenceTable:}}.${referenceJoinColumn} = ${this.formatSQLTable(
      `${mainQueryTable}.${referenceIDColumn}`
    )}`;

    const relationshipTitle = filterAttributeTitle.split('.')[0];
    const relationshipsSchema = this.relationshipsHelper.getSchema().relationships;
    const relationshipSchemaSection = relationshipsSchema[relationshipTitle];

    // for filters like <some_relationship>.<some_relationship_resource>.<some_relationship_resource> = 'some-value'
    // it's neccessary to add join condition <mainTable>.<context_resource_id_column> = '<some_relationship_resource_id>',
    // <some_relationship_resource_id> - id of some_relationship_resource in 'dictionary' table
    const filterAttribute = filterAttributeTitle.split('.').pop();

    if (
      Object.keys(relationshipSchemaSection).includes('resource_column') &&
      !['type', 'id'].includes(filterAttribute)
    ) {
      const relationshipContextResourceTable = relationshipsSchema[relationshipTitle].relation_table; // most of all it's a 'dictionaries'
      const relationshipsModels = this.relationshipsHelper.getRelationshipsModels();
      const relationshipContextResourceDBResult = await relationshipsModels[
        relationshipContextResourceTable
      ].model.getRowByField(
        String(referenceTable),
        String(relationshipsModels[relationshipContextResourceTable].titleColumn)
      );

      if (relationshipContextResourceDBResult.status) {
        const contextResourceID = relationshipContextResourceDBResult.data[0].id;
        const relationshipResourceColumn = relationshipSchemaSection.resource_column;
        const mainTableResourceColumnID = this.formatSQLTable(`${mainQueryTable}.${relationshipResourceColumn}`);
        const contextResourceTypeCondition = `${mainTableResourceColumnID} = ${contextResourceID}`;
        condition = `${condition} AND ${contextResourceTypeCondition}`;
      } else {
        this.logWarn('impossible define context resource id', null);
      }
    }

    const [join, alias] = this.getJoinWithAlias(referenceTable, condition, joins);

    template = `${alias}.${referenceQueryColumn} ${operands[attributeOperand]}`;
    if (includes(['in', 'nin'], attributeOperand)) {
      template = `${template} (${[map(attributeValues, () => '?').join(', ')]})`;
    }

    return {
      join,
      where: {
        delimiter,
        template,
        values
      }
    };
  }

  /**
   * Returns seletion fields list
   *
   * @param {string} selection
   * @param {string[]} ctxStateFields
   * @param {string} mainQueryTable
   * @returns {string[]}
   */
  private buildSelectionFields(selection: string, ctxStateFields: string[], mainQueryTable: string): string[] {
    if (!selection || selection === '*') {
      if (!ctxStateFields || !Array.isArray(ctxStateFields) || ctxStateFields.length === 0) {
        return [`${this.formatSQLTable(mainQueryTable).concat('.*')}`];
      }

      const schema = this.relationshipsHelper.getSchema();
      const primaryKey = findKey(schema.properties, ['primary', true]) || 'id';
      const relationshipsAttributes = chain(Object.values(schema.relationships))
        .map((rel: IKeyValue) => [get(rel, 'id_column'), get(rel, 'resource_column')])
        .flatten()
        .remove((attr: string) => attr)
        .value();

      const selectionAttributes = map([primaryKey, ...relationshipsAttributes], (attr: string) =>
        this.formatSQLTable(mainQueryTable).concat(`.\`${attr}\``)
      );

      for (const selectionField of ctxStateFields) {
        const parsedSelectionField = selectionField.split('.');
        if (parsedSelectionField.length > 1) {
          // do not add fileds for relationships resources (these fields are added in getIncludedRelationshipsQueryParts():387 ):
          //   - <relationship>.<relationship_attribute>
          //   - <relationship>.<relationship_resource>.<relationship_attribute>
          continue;
        }

        if (schema.attributes.includes(selectionField)) {
          selectionAttributes.push(`${this.formatSQLTable(mainQueryTable).concat(`.\`${selectionField}\``)}`);
        }
      }
      return selectionAttributes;
    }

    return [selection];
  }

  /**
   * Returns Included relationships query parts
   *
   * @param {string[]} ctxStateIncludes
   * @param {string[]} ctxStateFields
   * @param {string} mainQueryTable
   * @param { [key: string]: [string, string] } joins
   * @returns {Promise<IIncludedRelationshipsQueryParts>}
   */
  private async getIncludedRelationshipsQueryParts(
    ctxStateIncludes: string[],
    ctxStateFields: string[],
    mainQueryTable: string,
    joins: { [key: string]: [string, string] }
  ): Promise<IIncludedRelationshipsQueryParts> {
    const includedRelationshipsQueryParts: IIncludedRelationshipsQueryParts = {
      includedJoins: [],
      includedSelectionFields: []
    };

    if (!ctxStateIncludes || (Array.isArray(ctxStateIncludes) && ctxStateIncludes.length === 0)) {
      return includedRelationshipsQueryParts;
    }

    const availableIncludes = await this.relationshipsHelper.getAvailableIncludes();

    for (const relationshipInclude of ctxStateIncludes) {
      if (!availableIncludes.includes(relationshipInclude)) {
        this.logWarn(errors.UNAVAILABLE_INCLUDE.detail, { relationshipInclude });
        continue;
      }

      const [relationshipTitle, relationshipIncludeResource] = [...relationshipInclude.split('.')];

      const relationshipsSchema = this.relationshipsHelper.getSchema().relationships;
      let relationshipResource = relationshipIncludeResource;
      if (!relationshipResource && !relationshipsSchema[relationshipTitle].resource_column) {
        relationshipResource = relationshipsSchema[relationshipTitle].relation_table || 'dictionaries';
      }

      if (!relationshipResource) {
        this.logWarn(errors.UNAVAILABLE_INCLUDE_RESOURCE.detail, { relationshipInclude });
        continue;
      }

      // building included join ...
      const relationshipSchemaSection = relationshipsSchema[relationshipTitle].resource_column
        ? this.relationshipsFiltersFromSchema[`${relationshipTitle}.type`]
        : this.relationshipsFiltersFromSchema[`${relationshipTitle}.id`];

      if (!relationshipSchemaSection) {
        this.logWarn(errors.UNDEFINED_RELATIONSHIP_SCHEMA_SECTION.detail, { relationshipInclude });
        continue;
      }

      const referenceTable = getRelationshipTable(relationshipResource);
      if (!referenceTable) {
        this.logWarn(errors.UNDEFINED_RELATIONSHIP_TABLE.detail, { relationshipInclude });
        continue;
      }
      const referenceJoinColumn = relationshipSchemaSection.referenceJoinColumn || 'id';
      const referenceIDColumn = relationshipsSchema[relationshipTitle].id_column;

      const relationshipsModels = this.relationshipsHelper.getRelationshipsModels();

      const includedRelationshipModel = get(relationshipsModels, referenceTable);
      if (!relationshipsModels || !includedRelationshipModel) {
        this.logWarn(errors.UNDEFINED_RELATIONSHIP_MODEL.detail, { relationshipInclude });
        continue;
      }

      const referenceTableIDColumn = this.formatSQLTable(`${mainQueryTable}.${referenceIDColumn}`);
      const resourceCondition = `{{:referenceTable:}}.${referenceJoinColumn} = ${referenceTableIDColumn}`;
      let joinCondition = resourceCondition;

      // if relationship is complex (with 'resource_column') =>
      // 'join' should be added with condition:  wanted item should have resource be equal relationship resource
      if (relationshipsSchema[relationshipTitle].resource_column) {
        const relationshipContextResourceTable = relationshipsSchema[relationshipTitle].relation_table; // most of all it's a 'dictionaries'
        if (
          !Object.keys(relationshipsModels).includes(relationshipContextResourceTable) ||
          !Object.keys(relationshipsModels[relationshipContextResourceTable]).includes('model') ||
          typeof relationshipsModels[relationshipContextResourceTable].model.getRowByField !== 'function'
        ) {
          continue;
        }
        const relationshipContextResourceDBResult = await relationshipsModels[
          relationshipContextResourceTable
        ].model.getRowByField(
          String(relationshipIncludeResource),
          String(relationshipsModels[relationshipContextResourceTable].titleColumn)
        );

        if (!relationshipContextResourceDBResult.status) {
          this.logWarn('impossible define context resource id', { relationshipInclude });
          continue;
        }

        const contextResourceID = relationshipContextResourceDBResult.data[0].id;
        const mainTableResourceColumnID = this.formatSQLTable(
          `${mainQueryTable}.${relationshipsSchema[relationshipTitle].resource_column}`
        );
        const contextResourceCondition = `${mainTableResourceColumnID} = '${contextResourceID}'`;

        joinCondition = `${joinCondition} AND ${contextResourceCondition}`;
      }

      const [join, alias] = this.getJoinWithAlias(referenceTable, joinCondition, joins);

      includedRelationshipsQueryParts.includedJoins.push(join);

      // building included selection fields list ...
      const includedRelationshipModelSchema = includedRelationshipModel.model.getSchema();
      if (
        !includedRelationshipModelSchema ||
        typeof includedRelationshipModelSchema !== 'object' ||
        !has(includedRelationshipModelSchema, 'attributes')
      ) {
        this.logWarn(errors.UNDEFINED_RELATIONSHIP_MODEL_SCHEMA.detail, { relationshipInclude });
        continue;
      }

      // filtering relationships context fiels if it's need
      let relationshipFieldsFromContext;
      if (ctxStateFields && Array.isArray(ctxStateFields) && ctxStateFields.length > 0) {
        const relationshipFieldsPrefix = relationshipsSchema[relationshipTitle].resource_column
          ? `${relationshipTitle}.${relationshipResource}.`
          : `${relationshipTitle}.`;
        const re = new RegExp(`${relationshipFieldsPrefix}.`);
        relationshipFieldsFromContext = chain(Object.values(ctxStateFields))
          .remove((rf: string) => re.test(rf))
          .map((a: string) => a.replace(`${relationshipFieldsPrefix}`, ''))
          .value();
      }

      for (const relationshipAttribute of includedRelationshipModelSchema.attributes) {
        if (!relationshipFieldsFromContext || relationshipFieldsFromContext.includes(relationshipAttribute)) {
          const includedSelectionField = `${alias}.\`${relationshipAttribute}\` as _${relationshipTitle}_${relationshipResource}_${relationshipAttribute}`;
          includedRelationshipsQueryParts.includedSelectionFields.push(includedSelectionField);
        }
      }
    }

    return includedRelationshipsQueryParts;
  }

  /**
   * Puts out warning log
   *
   * @param {string} detail
   * @param {object} params
   */
  private logWarn(detail: string, params: object) {
    logger.warn(`Warning sqlQueryBuilder#getIncludedRelationshipsQueryParts : '${detail}'`, params, stackTrace.get());
  }

  /**
   * Returns merged attributes queries as IQuery
   *
   * @param {IQueryByAttributes} queryDataObjectByAttributes
   * @param {string[]} selectionFields
   * @param {string[]} includedJoins
   * @param {string} mainQueryTable
   * @returns {IQuery}
   */
  private mergeAttributesQueries(
    queryDataObjectByAttributes: IQueryByAttributes,
    selectionFields: string[],
    includedJoins: string[],
    mainQueryTable: string
  ): IQuery {
    let mergedJoins = chain(queryDataObjectByAttributes)
      .map((attributeQueryDataObject: IQueryByAttributes) => attributeQueryDataObject.join)
      .flattenDeep()
      .remove((join: string) => !isUndefined(join))
      .value();
    mergedJoins = concat(mergedJoins, includedJoins);

    const mergedWhereTemplates = flattenDeep(
      map(queryDataObjectByAttributes, (attributeQueryDataObject: IQueryByAttributes) => {
        return map(attributeQueryDataObject.wheres, (where: IQueryWhere) => `${where.template}${where.delimiter}`);
      })
    );
    mergedWhereTemplates[mergedWhereTemplates.length - 1] = mergedWhereTemplates[mergedWhereTemplates.length - 1]
      .replace(' OR ', '')
      .replace(' AND ', '');
    const mergedWhereTemplate = mergedWhereTemplates.join('');

    const mergedWhereValues = flattenDeep(
      map(queryDataObjectByAttributes, (attributeQueryDataObject: IQueryByAttributes) => {
        return map(attributeQueryDataObject.wheres, (where: IQueryWhere) => where.values);
      })
    );

    const queryDataObject: IQuery = {
      joins: mergedJoins,
      selectionFields,
      table: `${this.formatSQLTable(mainQueryTable)}`,
      where: {
        template: `WHERE ${mergedWhereTemplate}`,
        values: mergedWhereValues
      }
    };

    return queryDataObject;
  }

  /**
   * Returns empty query
   *
   * @returns {IQuery}
   */
  private emptyQuery(): IQuery {
    return {
      joins: [],
      selectionFields: [`${this.formatSQLTable(this.tables.mainTable)}.*`],
      table: `${this.formatSQLTable(this.tables.mainTable)}`,
      where: {
        template: '',
        values: []
      }
    };
  }

  /**
   * Checks if attribute filter has relationships
   *
   * @param {string} filterAttributeTitle
   * @returns {boolean}
   */
  private isAttributeFilterHasRelationships(filterAttributeTitle: string): boolean {
    return (
      this.checkIfAttributeFilterIsReltionshipFilter(filterAttributeTitle) &&
      !this.checkIfAttributeRelationshipFilterIsSimple(filterAttributeTitle)
    );
  }

  /**
   * Checks if attribute is a relationship filter (has prototype in relationships filters list)
   *
   * @param {string} attributeTitle
   * @returns {boolean}
   */
  private checkIfAttributeFilterIsReltionshipFilter(attributeTitle: string): boolean {
    return includes(this.relationshipsTitlesFiltersFromSchema, attributeTitle);
  }

  /**
   * Checks if attribute is a relationship filter and is a 'simple' (has prototype in relationships filters list and has not reference table).
   * So this filter doesn't require to join reference table.
   *
   * @param {string} attributeTitle
   */
  private checkIfAttributeRelationshipFilterIsSimple(attributeTitle: string) {
    return (
      includes(this.relationshipsTitlesFiltersFromSchema, attributeTitle) &&
      !has(this.relationshipsFiltersFromSchema[attributeTitle], 'referenceTable')
    );
  }

  /**
   * Returns unique alias for table
   *
   * @param {string} referenceTable
   * @param {string} condition
   * @param { { [key: string]: [string, string] }} joins
   * @returns {[string, string]}
   */
  private getJoinWithAlias(
    referenceTable: string,
    condition: string,
    joins: { [key: string]: [string, string] }
  ): [string, string] {
    const join = `LEFT JOIN ${this.formatSQLTable(referenceTable)} ON ${condition}`;
    const base64Join = Buffer.from(join).toString('base64');
    if (Object.keys(joins).includes(base64Join)) {
      return [null, joins[base64Join][1]];
    }

    const tableParts = referenceTable.split('.');
    const tableName = tableParts.length === 1 ? referenceTable : tableParts[1];
    let alias = tableName.slice(0, 4);

    const re = new RegExp(alias);
    const sameJoinsAliases = remove(Object.values(joins), (ja: [string, string]) => re.test(ja[1]));
    if (sameJoinsAliases.length > 0) {
      alias = `${alias}_${sameJoinsAliases.length}`;
    }

    const conditionWithReferenceTableAlias = condition.replace('{{:referenceTable:}}', alias);
    const joinWithAlias = [
      `LEFT JOIN ${this.formatSQLTable(referenceTable)} as ${alias} ON ${conditionWithReferenceTableAlias}`,
      alias
    ] as [string, string];

    joins[base64Join] = joinWithAlias;

    return joinWithAlias;
  }
}
