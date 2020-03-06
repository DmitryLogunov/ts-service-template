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
import routerAccounts from '@/tests/fakers/routes.with-accounts';
const server = initServer(routerAccounts);

let request: any = null;
let app: any = null;

/** defining test resource */
const resource = 'sample-resource';

jest.setTimeout(30000);

beforeAll(async done => {
  global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);
  global.dbClient.initDB(`${initSQLDumpDir}/init-sample-dump.sql`);
  global.dbClient.initDB(`${initSQLDumpDir}/init-sre-accounts-dump.sql`);
  global.dbClient.initDB(`${initSQLDumpDir}/init-sre-accounts-dump-sample-data.sql`);

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

test(`GET base-cntroller#include, accounts.case1: /${resource}?include=created_by`, async done => {
  const res = await request.get(`/${resource}?include=created_by`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case1.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case2: /${resource}?include=relationships_first.dictionaries,relationships_second,created_by`, async done => {
  const res = await request.get(
    `/${resource}?include=relationships_first.dictionaries,relationships_second,created_by`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case2.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case3: /${resource}?filter[created_by]=1&filter[created_by]=3&include=relationships_first.dictionaries,relationships_second,created_by`, async done => {
  const res = await request.get(
    `/${resource}?filter[created_by]=1&filter[created_by]=3&include=relationships_first.dictionaries,relationships_second,created_by`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case3.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case4: /${resource}?filter[relationships_first.type]=incidents&include=relationships_first.dictionaries,relationships_second,created_by`, async done => {
  const res = await request.get(
    `/${resource}?filter[relationships_first.type]=incidents&include=relationships_first.dictionaries,relationships_second,created_by`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case4.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case5: /${resource}?filter[relationships_first.type]=incidents&filter[relationships_second.id]=73&include=relationships_first.dictionaries,relationships_second,created_by`, async done => {
  const res = await request.get(
    `/${resource}?filter[relationships_first.type]=incidents&filter[relationships_second.id]=73&include=relationships_first.dictionaries,relationships_second,created_by`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case5.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case6: /${resource}?filter[created_by.last_name]=Jenkins&include=created_by`, async done => {
  const res = await request.get(`/${resource}?filter[created_by.last_name]=Jenkins&include=created_by`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case6.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case7: /${resource}?filter[relationships_first.accounts.last_name]=Jenkins`, async done => {
  const res = await request.get(`/${resource}?filter[relationships_first.accounts.last_name]=Jenkins`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case7.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case8: /${resource}?filter[relationships_first.accounts.last_name]=Jenkins&include=created_by`, async done => {
  const res = await request.get(
    `/${resource}?filter[relationships_first.accounts.last_name]=Jenkins&include=created_by`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case8.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case9: /${resource}?filter[relationships_first.accounts.last_name]=Jenkins&include=created_by,relationships_first.accounts`, async done => {
  const res = await request.get(
    `/${resource}?filter[relationships_first.accounts.last_name]=Jenkins&include=created_by,relationships_first.accounts`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case9.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});

test(`GET  base-cntroller#include, accounts.case10: /${resource}?fields=info,created_at,relationships_first.accounts.last_name,relationships_first.accounts.email,created_by.last_name&filter[relationships_first.accounts.last_name]=Jenkins&include=created_by,relationships_first.accounts`, async done => {
  const res = await request.get(
    `/${resource}?fields=info,created_at,relationships_first.accounts.last_name,relationships_first.accounts.email,created_by.last_name&filter[relationships_first.accounts.last_name]=Jenkins&include=created_by,relationships_first.accounts`
  );

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();

  const responseBodyShouldBePath = `${process.cwd()}/tests/data/models/sample-resource-model/base-controller.get.include.should-be/accounts.case10.response.should-be.json`;
  const responseBodyShouldBe = JSON.parse(fs.readFileSync(responseBodyShouldBePath, 'utf-8'));

  expect(isEqual(res.body, responseBodyShouldBe)).toBeTruthy();

  done();
});
