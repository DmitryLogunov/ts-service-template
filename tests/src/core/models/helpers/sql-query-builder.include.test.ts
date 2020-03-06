/* tslint:disable */

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', `${process.cwd()}/tests/data/config/`);

import { isEqual } from 'lodash';

import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';
import SqlQueryBuilder from '@/src/core/models/helpers/sql-query-builder';

test(`The sql query builder: checking #build with include parameter => case 1: ?filter[one][eq]=1&include=relationship_one.some_resource`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one',
      operand: 'eq',
      values: ['1']
    }
  ];
  const schemaRelationships: any = {
    relationships: {
      relationship_one: {
        id_column: 'one_id',
        relation_table: 'db.dictionaries',
        resource_column: 'one_resource_id'
      }
    }
  };

  const relationshipsModels = {
    'db.dictionaries': {
      model: {
        getSchema: () => {
          return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            additionalProperties: false,
            attributes: ['name', 'title', 'description', 'type']
          };
        },
        getByParams: (filter: any[]) => {
          return {
            data: [
              {
                id: '123',
                name: 'some_resource_name',
                title: 'some_resource',
                description: 'some_resource_description',
                type: 'some_resource_type'
              }
            ],
            status: true
          };
        },
        getRowByField: (value: string, column: string) => {
          return {
            data: [
              {
                id: '123',
                name: 'some_resource_name',
                title: 'some_resource',
                description: 'some_resource_description',
                type: 'some_resource_type'
              }
            ],
            status: true
          };
        }
      },
      titleColumn: 'title'
    },
    'db.some_resource_table': {
      model: {
        getSchema: () => {
          return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            additionalProperties: false,
            attributes: ['attr1', 'attr2']
          };
        },
        getByParams: (filter: any[]) => {
          return {
            data: [
              {
                id: '1',
                attr1: 'aaaa',
                attr2: 'bbb'
              }
            ],
            status: true
          };
        },
        getRowByField: (value: string, column: string) => {
          return {
            data: [{ id: '123' }],
            status: true
          };
        }
      },
      titleColumn: 'attr1'
    }
  };

  global.config.relationships = [
    {
      name: 'db.dictionaries',
      table: 'db.dictionaries'
    },
    {
      name: 'some_resource',
      table: 'db.some_resource_table'
    }
  ];

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels as any);
  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' }, relationshipsHelper);

  const ctxState = {
    include: ['relationship_one.some_resource']
  };

  const queryDataObjectShouldBe: any = {
    selectionFields: [
      '`db`.`some-table`.*',
      'some.`attr1` as _relationship_one_some_resource_attr1',
      'some.`attr2` as _relationship_one_some_resource_attr2'
    ],
    joins: [
      "LEFT JOIN `db`.`some_resource_table` as some ON some.id = `db`.`some-table`.`one_id` AND `db`.`some-table`.`one_resource_id` = '123'"
    ],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one` =?',
      values: ['1']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest, '*', ctxState);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});
