import fs from 'fs';
import { isEqual } from 'lodash';

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

jest.setTimeout(30000);

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

test(`GET base-cntroller#include, case1: /${resource}?include=relationships_first.dictionaries,created_by`, async done => {
  const res = await request.get(`/${resource}?include=relationships_first.dictionaries,created_by`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/case1.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, case2: /${resource}?include=relationships_second`, async done => {
  const res = await request.get(`/${resource}?include=relationships_second`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/case2.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, case4: /${resource}?include=relationships_first.dictionaries,relationships_second`, async done => {
  const res = await request.get(`/${resource}?include=relationships_first.dictionaries,relationships_second`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/case3.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});
