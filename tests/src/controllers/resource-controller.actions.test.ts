const resource = __filename
  .split('/')
  .pop()
  .split('-controller')[0];

import fs from 'fs';
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

/** uploading fake resource */
import * as fakeData from '@/tests/data/helpers/fake-data';

/** relationships helper */
import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';
const schema = JSON.parse(fs.readFileSync(`${process.cwd()}/src/models/${resource}-model/schema.json`, 'utf-8'));
const relationshipsHelper = new RelationshipsHelper(schema, resourcesSettings[resource].relationshipModels as any);

jest.setTimeout(30000);

beforeAll(async done => {
  global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

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

let sampleResourceId: number;
const checkingAttributes = ['title'];

/****************************************************************/

test(`POST /${resource}`, async done => {
  const sampleResourceDataItem = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );

  const { relationships } = await relationshipsHelper.buildRelationships(sampleResourceDataItem);
  const data = { data: { type: `${resource}`, attributes: sampleResourceDataItem, relationships } };
  setTimeout(async () => {
    const res = await request
      .post(`/${resource}`)
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);

    sampleResourceId = parseInt(res.body.data.id, 10);

    expect(res.status).toBe(201);
    expect(sampleResourceId).toBeGreaterThan(0);

    done();
  }, 1000);
});

test(`PATCH /${resource}/:id => if item exists it should response 200`, async done => {
  const dataForUpdatingSampleResourceItem = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );
  const { relationships } = await relationshipsHelper.buildRelationships(dataForUpdatingSampleResourceItem);
  const data = { data: { type: `${resource}`, attributes: dataForUpdatingSampleResourceItem, relationships } };

  const res = await request
    .patch(`/${resource}/${sampleResourceId}`)
    .send(data)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  expect(res.status).toBe(200);

  const updatedSampleResourceItem = await global.dbClient.query(
    `SELECT * FROM \`${resource}\` WHERE \`id\` = '${sampleResourceId}'`
  );

  for (const checkingAttribute of checkingAttributes) {
    expect(updatedSampleResourceItem.data[0][checkingAttribute]).toBe(
      dataForUpdatingSampleResourceItem[checkingAttribute]
    );
  }

  done();
});

test(`PATCH /${resource}/:id => if item doesn't exist it should response 404`, async done => {
  const dataForUpdatingSampleResourceItem = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );
  const { relationships } = await relationshipsHelper.buildRelationships(dataForUpdatingSampleResourceItem);
  const data = { data: { type: `${resource}`, attributes: dataForUpdatingSampleResourceItem, relationships } };
  const notExistsID = sampleResourceId + 1;

  const res = await request
    .patch(`/${resource}/${notExistsID}`)
    .send(data)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(404);

  expect(res.status).toBe(404);

  done();
});

test(`DELETE /${resource}/:id`, async done => {
  const res = await request.delete(`/${resource}/${sampleResourceId}`).expect(204);

  expect(res.status).toBe(204);

  const updatedSampleResourceItem = await global.dbClient.query(
    `SELECT * FROM \`${resource}\` WHERE \`id\` = '${sampleResourceId}'`
  );
  expect(updatedSampleResourceItem.data.length).toBe(0);

  done();
});
