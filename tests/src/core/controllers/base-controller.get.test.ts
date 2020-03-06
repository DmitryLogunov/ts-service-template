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

test('Not Found Path', async done => {
  const res = await request.get('/not_found_path');

  expect(res.status).toBe(404);
  expect(res.body.errors).toBeDefined();
  expect(res.body.errors[0]).toBeDefined();
  expect(res.body.errors[0].detail).toBeDefined();
  expect(res.body.errors[0].status).toBe(404);
  expect(res.body.errors[0].detail).toMatch(/GET \/not_found_path/);

  done();
});

test(`GET /${resource}`, async done => {
  const res = await request.get(`/${resource}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(4);
  expect(res.body.data[2].attributes.info).toBe('test3');

  done();
});

test(`GET /${resource}#common`, async done => {
  const res = await request.get(`/${resource}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data[0].id).toBeDefined();
  expect(res.body.data[0].type).toBeDefined();
  expect(res.body.data[0].attributes).toBeDefined();

  done();
});

test(`GET /${resource}#links`, async done => {
  const res = await request.get(`/${resource}`);

  expect(res.body.links).toBeDefined();
  expect(res.body.links.self).toBeDefined();

  done();
});
