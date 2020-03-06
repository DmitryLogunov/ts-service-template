/* tslint:disable */

import fs from 'fs';
import { isEqual } from 'lodash';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.tests.yaml', process.cwd() + '/tests/data/config/');

import FakeDBClient from '@/tests/fakers/fake-db-client';
import { initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const sqliteDbSettings = initSqliteDbSettings();
const initSQLDumpDir = `${process.cwd()}/tests/data/fake-db-client`;

global.dbClient = new FakeDBClient(
  `${initSQLDumpDir}/init-sample-dump.structure.sql`,
  sqliteDbSettings.sqliteFile
) as any;

global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);
global.dbClient.initDB(`${initSQLDumpDir}/init-sample-dump.sql`);

const { resource } = global.config;

// See test data:
//     - model schema: ../../../src/core/tests/fakers/models/test-resource-model/schema.json

import DictionariesModel from '@/tests/fakers/models/dictionaries-model';

const relationshipsModels = {
  dictionaries: {
    model: new DictionariesModel({ mainTable: 'dictionaries' }),
    titleColumn: 'title'
  }
};

import ResponseDataFormatter from '@/src/core/controllers/helpers/response-data-formatter';
import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';

const schemaPath = `${process.cwd()}/tests/fakers/models/resource-model/schema.json`;
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const relationshipsHelper = new RelationshipsHelper(schema, relationshipsModels as any);
const responseDataFormatter = new ResponseDataFormatter(schema, relationshipsHelper);

test('RelationshipsHelper # formatDataToResponse', async done => {
  const data = [
    {
      created_at: 'created_at_date_time',
      created_by: 'created_by_account_id',
      id: 1,
      info: 'some_text',
      some_numeric_property: 'some_value',
      relationships_first_id: 'relationships_first_id_value',
      relationships_first_type_id: '39',
      relationships_second_id: 'relationships_second_id_value',
      updated_at: 'updated_at_date_time',
      updated_by: 'updated_by_account_id'
    }
  ];

  const { data: formattedJsonAPIData } = await responseDataFormatter.formatDataToResponse(data as any, resource);

  const formattedJsonAPIDataShouldBe = {
    id: '1',
    type: `${resource}`,
    attributes: {
      info: 'some_text',
      some_numeric_property: 'some_value',
      created_at: 'created_at_date_time',
      updated_at: 'updated_at_date_time'
    },
    relationships: {
      relationships_first: {
        data: {
          id: 'relationships_first_id_value',
          type: 'maintenances'
        }
      },
      relationships_second: {
        data: {
          id: 'relationships_second_id_value',
          type: 'dictionaries'
        }
      },
      created_by: {
        data: {
          id: 'created_by_account_id',
          type: 'accounts'
        }
      },
      updated_by: {
        data: {
          id: 'updated_by_account_id',
          type: 'accounts'
        }
      }
    }
  };

  expect(isEqual(formattedJsonAPIData, formattedJsonAPIDataShouldBe)).toBeTruthy();

  done();
});
