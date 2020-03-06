const resource = __filename
  .split('/')
  .pop()
  .split('-controller')[0];

import supertest from 'supertest';

/* initializing test config */
import initConfig from '@/src/core/lib/init/config';
global.config = initConfig(`config.${resource}.yaml`, `${process.cwd()}/tests/data/config/`);

/* initializing Fake DB sqlite client & upload test data */
import FakeDBClient from '@/tests/fakers/fake-db-client';
import { deleteSqliteDBFileIfNeed, initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const sqliteDbSettings = initSqliteDbSettings();
const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client`;
const sqlDumpFilename = `${resource}.structure.sql`;

global.dbClient = new FakeDBClient(`${initSQLDumpDir}/${sqlDumpFilename}`, sqliteDbSettings.sqliteFile) as any;

/** initializing cotrollers and models */
import { ResourceController } from '@/src/controllers';
import { getRelationshipTable } from '@/src/core/helpers/config';
import { DictionariesModel, ResourceModel } from '@/src/models';

const dictionariesTable = getRelationshipTable('dictionaries');
const resourcesSettings: any = {
  [resource]: {
    controller: ResourceController,
    model: ResourceModel,
    relationshipModels: {
      [dictionariesTable]: {
        model: new DictionariesModel({ mainTable: dictionariesTable }),
        titleColumn: 'title'
      }
    }
  }
};

/** initializing server */
import initRouter from '@/src/core/lib/init/router';
import initServer from '@/src/core/lib/init/server';

const router = initRouter(global.config.resources, resourcesSettings);
const server = initServer(router);

let request: any = null;
let app: any = null;

/** uploading fake data */
import * as fakeData from '@/tests/data/helpers/fake-data';
const insertTemplatePath = `${process.cwd()}/tests/data/fake-db-client/${resource}-insert.template.sql`;

const sampleResourceItemsNumber = 10;

jest.setTimeout(30000);

beforeAll(async done => {
  global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

  await fakeData.insertData(
    global.dbClient,
    insertTemplatePath,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`),
    sampleResourceItemsNumber
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

/*******************************************************************************************/

test(`GET /${resource}`, async () => {
  const res = await request.get(`/${resource}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(sampleResourceItemsNumber);
});

test(`GET /${resource} filtering multiple`, async done => {
  const res = await request.get(`/${resource}?filter[id]=1&filter[id]=2`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBe(2);

  expect(String(res.body.data[0].id)).toBe(String(1));
  expect(String(res.body.data[1].id)).toBe(String(2));

  done();
});

test(`GET /${resource}#common`, async () => {
  const res = await request.get(`/${resource}`);

  expect(res.status).toBe(200);
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.length).toBeDefined();
  expect(res.body.data[0].id).toBeDefined();
  expect(res.body.data[0].type).toBeDefined();
  expect(res.body.data[0].attributes).toBeDefined();
});

test(`GET /${resource}#links`, async () => {
  const res = await request.get(`/${resource}`);

  expect(res.body.links).toBeDefined();
  expect(res.body.links.self).toBeDefined();
});
