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

test(`GET /${resource}?sort=info`, async () => {
  const sort = '?sort=info';
  const res = await request.get(`/${resource}${sort}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data.length).toBe(4);
  expect(res.body.data[0].attributes.info).toBe('test1');
  expect(res.body.data[0].attributes.some_numeric_property).toBe('1');
});

test(`GET /${resource}?sort=-info`, async () => {
  const sort = '?sort=-info';
  const res = await request.get(`/${resource}${sort}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data.length).toBe(4);
  expect(res.body.data[0].attributes.info).toBe('test4');
  expect(res.body.data[0].attributes.some_numeric_property).toBe('30');
});

test(`GET /${resource}?sort=created_at,-some_numeric_property`, async () => {
  const sort = '?sort=created_at,-some_numeric_property';
  const res = await request.get(`/${resource}${sort}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data.length).toBe(4);
  expect(res.body.data[0].attributes.info).toBe('test2');
  expect(res.body.data[0].attributes.some_numeric_property).toBe('5');
  expect(res.body.data[1].attributes.info).toBe('test1');
  expect(res.body.data[1].attributes.some_numeric_property).toBe('1');
});

test(`GET /${resource}?sort=created_at&sort=some_numeric_property`, async () => {
  const sort = '?sort=created_at,some_numeric_property';
  const res = await request.get(`/${resource}${sort}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data.length).toBe(4);
  expect(res.body.data[0].attributes.info).toBe('test1');
  expect(res.body.data[0].attributes.some_numeric_property).toBe('1');
  expect(res.body.data[1].attributes.info).toBe('test2');
  expect(res.body.data[1].attributes.some_numeric_property).toBe('5');
});
