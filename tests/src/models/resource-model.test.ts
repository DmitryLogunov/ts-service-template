const resource = __filename
  .split('/')
  .pop()
  .split('-model')[0];

import fs from 'fs';
import { throws } from 'smid';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
import { chain, filter, has, isEqual } from 'lodash';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig(`config.${resource}.yaml`, `${process.cwd()}/tests/data/config/`);

import FakeDBClient from '@/tests/fakers/fake-db-client';
global.dbClient = new FakeDBClient() as any;

const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client`;
global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

import { DictionariesModel } from '@/src/models';
import Model from '@/src/models/resource-model';

const resourceConfiguration = filter(
  global.config.resources,
  (resourceConfigurationData: any) => resourceConfigurationData.name === resource
)[0];

import { getRelationshipTable } from '@/src/core/helpers/config';

const dictionariesTable = getRelationshipTable('dictionaries');

const relationshipsModels = {
  [dictionariesTable]: {
    model: new DictionariesModel({ mainTable: 'dictionaries' }),
    titleColumn: 'title'
  }
};

const modelInstance: any = new Model(resourceConfiguration.tables, relationshipsModels as any);
const testDataDir = `${process.cwd()}/tests/data/models/${resource}-model`;

/** generating fake sample-resource */
import * as fakeData from '@/tests/data/helpers/fake-data';

const schema = JSON.parse(fs.readFileSync(`${process.cwd()}/src/models/${resource}-model/schema.json`, 'utf-8'));

/***********************************************************************************/

test(`The model '${resource}-model': checking schema validation => invalid schema: wrong type of some properties`, async () => {
  expect(typeof schema).toEqual('object');
  expect(typeof schema.properties).toEqual('object');

  const checkType = (type: string | string[]) => !(type === 'string' || isEqual(type, ['string', 'integer']));
  const wrongTypeProperties = filter(schema.properties, (property: any) => checkType(property.type));

  expect(wrongTypeProperties.length).toEqual(0);
});

test(`The model '${resource}-model': checking schema validation => invalid schema: check primary key`, async () => {
  expect(typeof schema).toEqual('object');
  expect(typeof schema.properties).toEqual('object');

  const checkIfPropertyIsPrimary = (propertyData: any) => has(propertyData, 'primary') && propertyData.primary;

  const primaryProperties = filter(schema.properties, (property: any) => checkIfPropertyIsPrimary(property));
  expect(primaryProperties.length).toEqual(1);
});

test(`The model '${resource}-model': checking schema validation => invalid random data`, async () => {
  const data = JSON.parse(await readFile(`${testDataDir}/invalid.json`, 'utf8'));
  const valid = throws(() => modelInstance.validate(data));

  expect(valid.message).toBeDefined();
});

test(`The model '${resource}-model': checking schema validation => invalid data: undefined some required attributes`, async () => {
  const data = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );

  expect(typeof schema).toEqual('object');

  if (schema.required && Array.isArray(schema.required) && schema.required.length > 0) {
    for (let i = 0; i < Math.min(2, schema.required.length); i++) {
      const randomIndex = Math.round(Math.random() * (schema.required.length - 1));
      const randomRequiredKey = schema.required[randomIndex];
      delete data[randomRequiredKey];
    }
  }

  const valid = throws(() => modelInstance.validate(data));

  expect(valid.message).toBeDefined();
});

test(`The model '${resource}-model': checking schema validation => invalid data: some property has not valid type`, async done => {
  const data: any = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );

  expect(typeof schema).toEqual('object');
  expect(typeof schema.properties).toEqual('object');

  const textTypePropertiesAttributes = chain(schema.properties)
    .mapValues((property: any) => (property.type === 'string' ? property : null))
    .entries()
    .remove((pair: any) => pair[1])
    .map((pair: any) => pair[0])
    .value();

  if (textTypePropertiesAttributes.length > 0) {
    const randomIndex = Math.round(Math.random() * (textTypePropertiesAttributes.length - 1));
    const randomTextPropertyAttribute = textTypePropertiesAttributes[randomIndex];
    data[randomTextPropertyAttribute] = 1;

    const valid = throws(() => modelInstance.validate(data));
    expect(valid.message).toBeDefined();

    done();
  }

  expect(true).toBeTruthy();
});

test(`The model '${resource}-model': checking schema validation => valid data`, async () => {
  const data = await fakeData.generateRandomDataItem(
    global.dbClient,
    require(`@/tests/data/fake-db-client/${resource}-insert.field-types.json`)
  );

  const valid = await modelInstance.validate(data);
  expect(valid).toBe(true);
});
