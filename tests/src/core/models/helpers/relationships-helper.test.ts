/* tslint:disable */

import { isEqual } from 'lodash';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', `${process.cwd()}/tests/data/config/`);

import FakeDBClient from '@/tests/fakers/fake-db-client';
import { initSqliteDbSettings } from '@/tests/helpers/init-sqlite-db';

const initSQLDumpDir = process.cwd() + '/tests/data/fake-db-client';

const sqliteDbSettings = initSqliteDbSettings();

global.dbClient = new FakeDBClient(`${initSQLDumpDir}/init-sre-comments-dump.sql`, sqliteDbSettings.sqliteFile) as any;
global.dbClient.initDB(`${initSQLDumpDir}/init-dictionaries-dump.sql`);

import RelationshipsHelper from '@/src/core/models/helpers/relationships-helper';
import DictionariesModel from '@/src/models/dictionaries-model';

/****************  RelationshipsHelper # buildRelationships  *******************/

test(`The relationships helper: checking #buildRelationships => case 1`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      context: {
        resource_column: 'context_resource',
        id_column: 'context_id'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const sampleData = { id: '1', context_resource: 'incidents', context_id: '43602' };

  const relationshipsShouldBe = {
    context: { data: { type: 'incidents', id: sampleData['context_id'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 2`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      context: {
        relation_table: 'dictionaries',
        resource_column: 'context_resource',
        id_column: 'context_id'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const sampleData = { id: '1', context_resource: '39', context_id: '43602' };

  const relationshipsShouldBe = {
    context: { data: { type: 'maintenances', id: sampleData['context_id'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 3`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      comment_type: {}
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const sampleData = { id: '1', comment_type: '73' };

  const relationshipsShouldBe = {
    comment_type: { data: { type: 'dictionaries', id: sampleData['comment_type'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 4`, async done => {
  global.config = initConfig('config.relationships-dot-tables.yaml', process.cwd() + '/tests/data/config/');

  const schemaRelationships: any = {
    relationships: {
      some_field: {
        relation_table: 'some_table'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);

  const sampleData = { id: '1', some_field: '25' };

  const relationshipsShouldBe = {
    some_field: { data: { type: 'some_table', id: sampleData['some_field'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 5`, async done => {
  global.config = initConfig('config.sample-resource.yaml', process.cwd() + '/tests/data/config/');

  const schemaRelationships: any = {
    relationships: {
      created_by: {
        relation_table: 'accounts',
        id_column: 'account_id'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);

  const sampleData = { id: '1', account_id: '73' };

  const relationshipsShouldBe = {
    created_by: { data: { type: 'accounts', id: sampleData['account_id'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 6`, async done => {
  const schemaRelationships: any = {
    relationships: {
      created_by: {
        relation_table: 'accounts',
        id_column: 'created_by'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);

  const sampleData = { id: '1', created_by: '73' };

  const relationshipsShouldBe = {
    created_by: { data: { type: 'accounts', id: sampleData['created_by'] } }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 7`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      context: {
        relation_table: 'dictionaries',
        resource_column: 'context_resource',
        id_column: 'context_id'
      },
      comment_type: {},
      created_by: {
        relation_table: 'accounts',
        id_column: 'created_by'
      },
      updated_by: {
        relation_table: 'accounts',
        id_column: 'updated_by'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const sampleData: any = {
    id: '1',
    created_by: '73',
    updated_by: null,
    context_id: '10',
    context_resource: '39',
    comment_type: '73'
  };

  const relationshipsShouldBe: any = {
    context: { data: { type: 'maintenances', id: sampleData['context_id'] } },
    comment_type: { data: { type: 'dictionaries', id: sampleData['comment_type'] } },
    created_by: { data: { type: 'accounts', id: sampleData['created_by'] } },
    updated_by: { data: null }
  };

  const { relationships } = await relationshipsHelper.buildRelationships(sampleData);

  expect(isEqual(relationships, relationshipsShouldBe)).toBeTruthy();

  done();
});

/****************  RelationshipsHelper # parseRelationships  *******************/

test(`The relationships helper: checking #parseRelationships => case 1`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      context: {
        resource_column: 'context_resource',
        id_column: 'context_id'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const relationships: any = {
    context: { data: { type: 'some_resource', id: 243551 } }
  };

  const resultDataShouldBe = {
    context_resource: relationships.context.data.type,
    context_id: relationships.context.data.id.toString()
  };

  const resultData = await relationshipsHelper.parseRelationships(relationships);

  expect(isEqual(resultData, resultDataShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #parseRelationships => case 2`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      context: {
        relation_table: 'dictionaries',
        resource_column: 'context_resource',
        id_column: 'context_id'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const relationships: any = {
    context: { data: { type: 'incidents', id: 243551 } }
  };

  const resultDataShouldBe = {
    context_resource: '41',
    context_id: relationships.context.data.id.toString()
  };

  const resultData = await relationshipsHelper.parseRelationships(relationships);

  expect(isEqual(resultData, resultDataShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #parseRelationships => case 3`, async done => {
  const dictionariesModel = new DictionariesModel({ mainTable: 'dictionaries' });
  const relationshipsModels: any = {
    dictionaries: {
      model: dictionariesModel,
      titleColumn: 'title'
    }
  };
  const schemaRelationships: any = {
    relationships: {
      comment_type: {}
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);

  const resultDataShouldBe = { comment_type: '73' };

  const relationships = {
    comment_type: { data: { type: 'dictionaries', id: resultDataShouldBe['comment_type'] } }
  };

  const resultData = await relationshipsHelper.parseRelationships(relationships);

  expect(isEqual(resultData, resultDataShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #buildRelationships => case 4`, async done => {
  const schemaRelationships: any = {
    relationships: {
      some_field: {
        relation_table: 'some_table'
      }
    }
  };

  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);

  const resultDataShouldBe = { some_field: '25' };

  const relationships = {
    some_field: { data: { type: 'some_table', id: resultDataShouldBe['some_field'] } }
  };

  const resultData = await relationshipsHelper.parseRelationships(relationships);

  expect(isEqual(resultData, resultDataShouldBe)).toBeTruthy();

  done();
});

/****************  RelationshipsHelper # getFiltersFromSchema  *******************/

test(`The relationships helper: checking #getFiltersFromSchema => case 1`, async done => {
  const schemaRelationships: any = {
    relationships: {
      context: {
        resource_column: 'context_resource',
        id_column: 'context_id'
      }
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);
  const filtersShouldBe = {
    'context.id': {
      column: 'context_id'
    },
    'context.type': {
      column: 'context_resource'
    }
  };
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 2`, async done => {
  const schemaRelationships: any = {
    relationships: {
      context: {
        relation_table: 'dictionaries',
        resource_column: 'context_resource_id',
        id_column: 'context_id'
      }
    }
  };
  const relationshipsModels: any = {
    dictionaries: {
      model: {
        getByParams: () => {
          return new Promise(resolve => {
            resolve({ data: [{}], status: true });
          });
        }
      },
      titleColumn: 'title'
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);
  const filtersShouldBe = {
    'context.type': {
      column: 'context_resource_id',
      referenceTable: 'dictionaries',
      referenceJoinColumn: 'id',
      referenceQueryColumn: 'title'
    },
    'context_type.id': {
      column: 'context_resource_id'
    },
    'context.id': {
      column: 'context_id'
    }
  };

  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 3`, async done => {
  const schemaRelationships: any = {
    relationships: {
      context: {
        relation_table: 'dictionaries',
        resource_column: 'some_context_resource_column',
        id_column: 'some_context_id_column'
      }
    }
  };
  const relationshipsModels: any = {
    dictionaries: {
      model: {
        getByParams: () => {
          return new Promise(resolve => {
            resolve({ data: [{}], status: true });
          });
        }
      },
      titleColumn: 'title'
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships, relationshipsModels);
  const filtersShouldBe = {
    'context.type': {
      column: 'some_context_resource_column',
      referenceTable: 'dictionaries',
      referenceJoinColumn: 'id',
      referenceQueryColumn: 'title'
    },
    'context_type.id': {
      column: 'some_context_resource_column'
    },
    'context.id': {
      column: 'some_context_id_column'
    }
  };
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 4`, async done => {
  const schemaRelationships: any = {
    relationships: {
      comment_type: {
        id_column: 'comment_type_id'
      }
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);
  const filtersShouldBe = {
    'comment_type.id': {
      column: 'comment_type_id'
    }
  };
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 5`, async done => {
  const schemaRelationships: any = {
    relationships: {
      comment_type_id: {}
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);
  const filtersShouldBe = {
    'comment_type.id': {
      column: 'comment_type_id'
    }
  };
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 6`, async done => {
  const schemaRelationships: any = {
    comment_type: {}
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);
  const filtersShouldBe = {};
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});

test(`The relationships helper: checking #getFiltersFromSchema => case 7`, async done => {
  const schemaRelationships: any = {
    relationships: {
      created_by: {
        relation_table: 'accounts',
        id_column: 'created_by_id'
      }
    }
  };
  const relationshipsHelper = new RelationshipsHelper(schemaRelationships);
  const filtersShouldBe = {
    'created_by.id': {
      column: 'created_by_id'
    }
  };
  const filters = await relationshipsHelper.getFiltersFromSchema();

  expect(isEqual(filters, filtersShouldBe)).toBeTruthy();

  done();
});
