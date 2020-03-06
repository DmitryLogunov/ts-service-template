import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.tests.yaml', `${process.cwd()}/tests/data/config`);

import FakeDBClient from '@/tests/fakers/fake-db-client';
import randomstring from 'randomstring';

import { deleteSqliteDBFileIfNeed, initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client/`;
const initSQLDumpPath = `${process.cwd()}/tests/data/fake-db-client/init-sample-dump.structure.sql`;

const sqliteDbSettings = initSqliteDbSettings();

const fakeDBClient = new FakeDBClient(initSQLDumpPath, sqliteDbSettings.sqliteFile);

/** defining test resource */
const resource = 'sample-resource';

beforeAll(async done => {
  fakeDBClient.initDB(`${initSQLDumpDir}/init-sample-dump.sql`);
  done();
});

afterAll(() => {
  fakeDBClient.close();
  deleteSqliteDBFileIfNeed(sqliteDbSettings);
});

test('FakeDBClient#query', async () => {
  const result: any = await fakeDBClient.query(`SELECT * FROM \`${resource}\` WHERE id = ?`, ['2']);

  expect(result.data[0].info).toBe('test2');
});

test('FakeDBClient#run', async () => {
  const sampleId = '100';
  const sampleInfo = randomstring.generate();

  await fakeDBClient.query(`INSERT INTO  \`${resource}\` (id, info) VALUES (?, ?)`, [sampleId, sampleInfo]);
  const result: any = await fakeDBClient.query(`SELECT * FROM \`${resource}\` WHERE id = ?`, [sampleId]);

  expect(result.data[0].info).toBe(sampleInfo);
});

test('FakeDBClient#run', async () => {
  const sampleInfo = randomstring.generate();
  const result: any = await fakeDBClient.query(`INSERT INTO  \`${resource}\` (info) VALUES (?)`, [sampleInfo]);

  expect(result.status).toBeTruthy();
  expect(result.data.insertId).toBeGreaterThan(0);
});
