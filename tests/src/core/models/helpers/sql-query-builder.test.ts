/* tslint:disable */

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', `${process.cwd()}/tests/data/config/`);

import { isEqual } from 'lodash';

import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';
import SqlQueryBuilder from '@/src/core/models/helpers/sql-query-builder';

test(`The sql query builder: checking #build => case 1 (two different filters): ?filter[one][eq]=1&filter[two][gt]=2`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one',
      operand: 'eq',
      values: ['1']
    },
    {
      field: 'two',
      operand: 'gt',
      values: ['2']
    }
  ];

  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' });
  const queryDataObjectShouldBe: any = {
    joins: [],
    selectionFields: ['`db`.`some-table`.*'],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one` =? AND `db`.`some-table`.`two` >?',
      values: ['1', '2']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 2 (filter 'in'): ?filter[one][eq]=1&filter[one][eq]=2`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one',
      operand: 'in',
      values: ['1', '2']
    }
  ];

  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' });
  const queryDataObjectShouldBe: any = {
    joins: [],
    selectionFields: ['`db`.`some-table`.*'],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one` IN (?, ?)',
      values: ['1', '2']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 3 (simple relationship 'eq' filter): ?filter[one.id][eq]=1`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one.id',
      operand: 'eq',
      values: ['1']
    }
  ];
  const schemaRelationships: any = {
    relationships: {
      one: {
        id_column: 'one_id',
        relation_table: 'dictionaries'
      }
    }
  };
  const relationshipsModels: any = {
    dictionaries: {
      model: {
        getSchema: () => {
          return {
            attributes: [] as any
          };
        }
      },
      titleColumn: 'title'
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);
  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' }, relationshipsHelper);

  const queryDataObjectShouldBe: any = {
    joins: [],
    selectionFields: ['`db`.`some-table`.*'],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one_id` =?',
      values: ['1']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 4 (complex 'type' relationship 'eq' filter with not composite ref table): ?filter[one_type.id][eq]=some_value_from_dictionary`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one_type.id',
      operand: 'eq',
      values: ['some_value_from_dictionary']
    }
  ];
  const schemaRelationships: any = {
    relationships: {
      one: {
        id_column: 'one_id',
        relation_table: 'dictionaries',
        resource_column: 'one_resource_id'
      }
    }
  };
  const relationshipsModels: any = {
    dictionaries: {
      model: {
        getByParams: () => {
          return new Promise(resolve => {
            resolve({ data: [{}], status: true });
          });
        }
      },
      titleColumn: 'title'
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);
  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' }, relationshipsHelper);

  const queryDataObjectShouldBe: any = {
    selectionFields: ['`db`.`some-table`.*'],
    joins: [],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one_resource_id` =?',
      values: ['some_value_from_dictionary']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 5 (complex 'type' relationship 'eq' filter with composite ref table): ?filter[one.type][eq]=some_value_from_dictionary`, async done => {
  global.config = initConfig('config.relationships-dot-tables.yaml', process.cwd() + '/tests/data/config/');

  const parsedFiltersFromRequest = [
    {
      field: 'one.type',
      operand: 'eq',
      values: ['some_value_from_dictionary']
    }
  ];
  const schemaRelationships: any = {
    relationships: {
      one: {
        id_column: 'one_id',
        relation_table: 'dictionaries',
        resource_column: 'one_resource_id'
      }
    }
  };

  const relationshipsModels = {
    'db.dictionaries': {
      model: {
        getByParams: () => {
          return new Promise(resolve => {
            resolve({ data: [{}], status: true });
          });
        }
      },
      titleColumn: 'title'
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels as any);
  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' }, relationshipsHelper);

  const queryDataObjectShouldBe: any = {
    selectionFields: ['`db`.`some-table`.*'],
    joins: ['LEFT JOIN `db`.`dictionaries` as dict ON dict.id = `db`.`some-table`.`one_resource_id`'],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE dict.title =?',
      values: ['some_value_from_dictionary']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 6 ( ?filter[one][like]=abc )`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one',
      operand: 'like',
      values: ['abc']
    }
  ];

  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' });
  const queryDataObjectShouldBe: any = {
    selectionFields: ['`db`.`some-table`.*'],
    joins: [],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one` LIKE ?',
      values: ['%abc%']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});

test(`The sql query builder: checking #build => case 7 ( ?filter[one, two][like]=abc )`, async done => {
  const parsedFiltersFromRequest = [
    {
      field: 'one, two',
      operand: 'like',
      values: ['abc']
    }
  ];

  const sqlQueryBuilder = new SqlQueryBuilder({ mainTable: 'db.some-table' });
  const queryDataObjectShouldBe: any = {
    selectionFields: ['`db`.`some-table`.*'],
    joins: [],
    table: '`db`.`some-table`',
    where: {
      template: 'WHERE `db`.`some-table`.`one` LIKE ? OR `db`.`some-table`.`two` LIKE ?',
      values: ['%abc%', '%abc%']
    }
  };

  const queryDataObject = await sqlQueryBuilder.build(parsedFiltersFromRequest);

  expect(isEqual(queryDataObject, queryDataObjectShouldBe)).toBeTruthy();

  done();
});
