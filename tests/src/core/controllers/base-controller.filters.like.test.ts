/* tslint:disable */

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', process.cwd() + '/tests/data/config/');

import supertest from 'supertest';

import FakeDBClient from '@/tests/fakers/fake-db-client';
import { initSqliteDbSettings, deleteSqliteDBFileIfNeed } from '@/tests/helpers/init-sqlite-db';

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

/** uploading fake sample-resource */
import * as fakeData from '@/tests/data/helpers/fake-data';
import sampleResourceFieldsTypes from '@/tests/data/fake-db-client/init-sample-resource-insert.field-types.json';

const insertTemplatePath = `${process.cwd()}/tests/data/fake-db-client/init-sample-resource-insert.template.sql`;

beforeAll(async done => {
  global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

  const sampleData = [
    { info: 'bbbees1' },
    { info: 'cccdds2' },
    { info: 'dddffd4' },
    { info: 'eeehhg5' },
    { info: 'ffjwwd4' }
  ];

  await fakeData.insertData(
    global.dbClient,
    insertTemplatePath,
    sampleResourceFieldsTypes,
    sampleData.length,
    sampleData
  );

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

/***************************************************************************************************/

test(`GET /${resource}?filter[info][like]=ww`, async () => {
  const filtersParams = '?filter[info][like]=ww';
  const res = await request.get(`/${resource}${filtersParams}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].attributes.info).toBe('ffjwwd4');
});
