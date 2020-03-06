import { includes, map } from 'lodash';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', process.cwd() + '/tests/data/config/');

import supertest from 'supertest';

import FakeDBClient from '@/tests/fakers/fake-db-client';
import { deleteSqliteDBFileIfNeed, initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const sqliteDbSettings = initSqliteDbSettings();
const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client`;

global.dbClient = new FakeDBClient(
  `${initSQLDumpDir}/init-sample-dump.structure.sql`,
  sqliteDbSettings.sqliteFile
) as any;

import initServer from '@/src/core/lib/init/server';
import router from '@/tests/fakers/routes';
const server = initServer(router);

let request: any = null;
let app: any = null;

/** defining test resource */
const resource = 'sample-resource';

beforeAll(async done => {
  global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);
  global.dbClient.initDB(`${initSQLDumpDir}/init-sample-dump.sql`);

  setTimeout(() => {
    app = server.listen();
    request = supertest.agent(app);
    done();
  }, 100);
});

afterAll(() => {
  app.close();
  deleteSqliteDBFileIfNeed(sqliteDbSettings);
});

// See test data:
//     - test controller: ../../../src/core/tests/fakers/controllers/index
//     - test model: ../../../src/core/tests/fakers/models/resource
//     - model schema: ../../../src/core/tests/fakers/models/resource/schema.json
//     - SQL data dump:
//           ../../data/fake-db-client/init-sample-dump.structure.sql
//           ../../data/fake-db-client/init-sample-dump.sql

test(`GET /${resource}?filter[info]=test2`, async () => {
  const filtersParams = '?filter[info]=test2';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.some_numeric_property).toBe('5');
});

test(`GET /${resource}?filter[some_numeric_property]=5`, async () => {
  const filtersParams = '?filter[some_numeric_property]=5';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test2');
});

test(`GET /${resource}?filter[info]=test2&filter[info]=test3&filter[info]=test4&filter[some_numeric_property][lt]=30`, async () => {
  const filtersParams =
    '?filter[info]=test2&filter[info]=test3&filter[info]=test4&filter[some_numeric_property][lt]=30';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test2')).toBeTruthy();
  expect(includes(infoList, 'test3')).toBeTruthy();
});

test(`GET /${resource}?filter[some_numeric_property][gt]=5`, async () => {
  const filtersParams = '?filter[some_numeric_property][gt]=5';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test3')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[some_numeric_property][gt]=1&filter[some_numeric_property][lt]=30`, async () => {
  const filtersParams = '?filter[some_numeric_property][gt]=1&filter[some_numeric_property][lt]=30';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test2')).toBeTruthy();
  expect(includes(infoList, 'test3')).toBeTruthy();
});

test(`GET /${resource}?filter[some_numeric_property]=1&filter[some_numeric_property]=30`, async () => {
  const filtersParams = '?filter[some_numeric_property]=1&filter[some_numeric_property]=30';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_first.id]=1`, async () => {
  const filtersParams = '?filter[relationships_first.id]=1';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test2');
});

test(`GET /${resource}?filter[relationships_first.id]=1&filter[relationships_first.id]=78`, async () => {
  const filtersParams = '?filter[relationships_first.id]=1&filter[relationships_first.id]=78';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test2')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_first.id][gt]=1&filter[relationships_first.id][lt]=78`, async () => {
  const filtersParams = '?filter[relationships_first.id][gt]=1&filter[relationships_first.id][lt]=78';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test3')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_first_type.id]=38`, async () => {
  const filtersParams = '?filter[relationships_first_type.id]=38';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_first_type.id]=38&filter[some_numeric_property][lt]=20`, async () => {
  const filtersParams = '?filter[relationships_first_type.id]=38&filter[some_numeric_property][lt]=20';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test1');
});

test(`GET /${resource}?filter[relationships_first.type]=incidents`, async () => {
  const filtersParams = '?filter[relationships_first.type]=incidents';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test3');
});

test(`GET /${resource}?filter[relationships_second.id]=73`, async () => {
  const filtersParams = '?filter[relationships_second.id]=73';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test3')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_second.id][gt]=74`, async () => {
  const filtersParams = '?filter[relationships_second.id][gt]=74';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test2')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_second.id]=73&filter[relationships_second.id]=75`, async () => {
  const filtersParams = '?filter[relationships_second.id]=73&filter[relationships_second.id]=75';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(4);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test2')).toBeTruthy();
  expect(includes(infoList, 'test3')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[relationships_second.id]=73&filter[some_numeric_property][lt]=4`, async () => {
  const filtersParams = '?filter[relationships_second.id]=73&filter[some_numeric_property][lt]=4';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test1');
});

test(`GET /${resource}?filter[created_at]=2019-05-01 12:00:00`, async () => {
  const filtersParams = '?filter[created_at]=2019-05-01 12:00:00';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test1')).toBeTruthy();
  expect(includes(infoList, 'test2')).toBeTruthy();
});

test(`GET /${resource}?filter[created_at][gt]=2019-05-01 12:00:00`, async () => {
  const filtersParams = '?filter[created_at][gt]=2019-05-01 12:00:00';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  const infoList = map(res.body.data, (item: any) => item.attributes.info);
  expect(includes(infoList, 'test3')).toBeTruthy();
  expect(includes(infoList, 'test4')).toBeTruthy();
});

test(`GET /${resource}?filter[created_at][gt]=2019-05-01 13:00:00&filter[created_at][lt]=2019-05-04 11:00:00`, async () => {
  const filtersParams = '?filter[created_at][gt]=2019-05-01 13:00:00&filter[created_at][lt]=2019-05-04 11:00:00';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test3');
});

test(`GET /${resource}?filter[created_at][gt]=2019-05-01 10:00:00&filter[some_numeric_property][lt]=4`, async () => {
  const filtersParams = '?filter[created_at][gt]=2019-05-01 10:00:00&filter[some_numeric_property][lt]=4';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('test1');
});
