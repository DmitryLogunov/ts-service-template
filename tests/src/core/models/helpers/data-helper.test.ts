import fs from 'fs';
import { isEqual } from 'lodash';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', `${process.cwd()}/tests/data/config/`);

import FakeDBClient from '@/tests/fakers/fake-db-client';
import { initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const sqliteDbSettings = initSqliteDbSettings();
const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client`;

global.dbClient = new FakeDBClient(
  `${initSQLDumpDir}/init-sample-dump.structure.sql`,
  sqliteDbSettings.sqliteFile
) as any;

global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

import DataHelper from '@/src/core/models/helpers/data-helper';
import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';
import DictionariesModel from '@/tests/fakers/models/dictionaries-model';

const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
const relationshipsModels: any = {
  dictionaries: {
    model: dictionariesModel,
    titleColumn: 'title'
  }
};

const schemaPath = `${process.cwd()}/tests/fakers/models/resource-model/schema.json`;
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const relationshipsHelper = new RelationshipsHelper(schema, relationshipsModels);

const tables = global.config.resources[0].tables;

test(`DataHelper # replacePropertiesToAliases`, async done => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);

  const sampleData = { some_numeric_property: 'some_value' };
  const processedSampleData = await dataHelper.replacePropertiesToAliases(sampleData);
  const processedSampleDataShouldBe = { some_numeric_property_alias: 'some_value' };

  expect(isEqual(processedSampleData, processedSampleDataShouldBe)).toBeTruthy();

  done();
});

test(`DataHelper # replaceAliasesToProperties`, async done => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);

  const sampleData = { some_numeric_property_alias: 'some_value' };
  const processedSampleDataShouldBe = { some_numeric_property: 'some_value' };
  const processedSampleData = dataHelper.replaceAliasesToProperties(sampleData);

  expect(isEqual(processedSampleData, processedSampleDataShouldBe)).toBeTruthy();

  done();
});

test(`DataHelper # getPayloadFromQueryParams`, async done => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);

  const queryParams = [
    {
      field: 'some_numeric_property',
      operand: 'eq',
      values: ['some_value']
    },
    {
      field: 'relationships_first.id',
      operand: 'gt',
      values: ['some_relationships_first_value_id']
    },
    {
      field: 'relationships_first.type',
      operand: 'lt',
      values: ['some_relationships_first_type_value_id']
    },
    {
      field: 'relationships_second.id',
      operand: 'eq',
      values: ['some_relationships_second_value_id']
    }
  ];

  const parsedPayloadShouldBe = {
    relationships_first_id: 'some_relationships_first_value_id',
    relationships_second_id: 'some_relationships_second_value_id',
    some_numeric_property: 'some_value'
  };

  const parsedPayload = await dataHelper.getPayloadFromQueryParams(queryParams);

  expect(isEqual(parsedPayload, parsedPayloadShouldBe)).toBeTruthy();

  done();
});

test(`DataHelper # getLimitation`, () => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);

  let limit = 100;
  let page = 2;
  let limitationShouldBe = `LIMIT ${limit * page}, ${limit}`;
  let limitation = dataHelper.getLimitation(limit, page);

  expect(limitation).toEqual(limitationShouldBe);

  limit = 100;
  page = -1;
  limitationShouldBe = '';
  limitation = dataHelper.getLimitation(limit, page);

  expect(limitation).toEqual(limitationShouldBe);
});

test(`DataHelper # getSorting`, () => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);

  const sortsParams = 'attribute1,-attribute2';

  const sortingShouldBe = {
    condition: {
      '`sample-resource`.`attribute1`': 'ASC',
      '`sample-resource`.`attribute2`': 'DESC'
    },
    keys: ['attribute1', 'attribute2']
  };

  const sorting = dataHelper.getSorting(sortsParams);

  expect(isEqual(sorting, sortingShouldBe)).toBeTruthy();
});

test('DataHelper #Sorting', async done => {
  const dataHelper = new DataHelper(schema, tables, relationshipsHelper);
  const sortsAttributes = 'id,-title,attribute';
  const sort = dataHelper.getSorting(sortsAttributes);

  expect(sort.keys).toBeDefined();
  expect(sort.keys.length).toBeDefined();
  expect(sort.keys.length).toBe(3);

  expect(sort.condition).toBeDefined();
  expect(Object.keys(sort.condition).length).toBe(3);

  expect(sort.condition['`sample-resource`.`id`']).toBeDefined();
  expect(sort.condition['`sample-resource`.`id`']).toBe('ASC');

  expect(sort.condition['`sample-resource`.`title`']).toBeDefined();
  expect(sort.condition['`sample-resource`.`title`']).toBe('DESC');

  expect(sort.condition['`sample-resource`.`attribute`']).toBeDefined();
  expect(sort.condition['`sample-resource`.`attribute`']).toBe('ASC');

  done();
});
