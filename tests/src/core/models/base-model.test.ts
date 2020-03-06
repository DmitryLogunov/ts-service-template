import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.tests.yaml', `${process.cwd()}/tests/data/config/`);

import fs from 'fs';
import { throws } from 'smid';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);

import FakeDBClient from '@/tests/fakers/fake-db-client';
global.dbClient = new FakeDBClient(null, null) as any;

import BaseModel from '@/src/core/models/base-model';
const testDataDir = `${process.cwd()}/tests/data/models/base-model`;

const model: any = new BaseModel({ mainTable: 'sample-table' }, null, `${testDataDir}/schema.json`, 100);

test('Valid data', async () => {
  const data = JSON.parse(await readFile(`${testDataDir}/valid.json`, 'utf8'));
  const valid = await model.validate(data);

  expect(valid).toBe(true);
});

test('Invalid data (not match to schema)', async () => {
  const data = JSON.parse(await readFile(`${testDataDir}/invalid.json`, 'utf8'));
  const valid = await throws(() => model.validate(data));

  expect(valid.message).toBeDefined();
});

test("Invalid data ('strict' mode, not defined required property)", async () => {
  const data = JSON.parse(await readFile(`${testDataDir}/valid.json`, 'utf8'));
  delete data.info;

  const valid = await throws(() => model.validate(data));

  expect(valid.message).toBeDefined();
});

test("Invalid data ('soft' mode, not defined required property)", async () => {
  const data = JSON.parse(await readFile(`${testDataDir}/valid.json`, 'utf8'));
  delete data.title;

  const valid = await model.validate(data, 'soft');

  expect(valid).toBe(true);
});
