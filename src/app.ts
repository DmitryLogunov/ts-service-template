import initConfig from './core/lib/init/config';
global.config = initConfig('config.yaml');

import initDB from './core/lib/init/db';
global.dbClient = initDB(global.config.dbSettings);

import { getRelationshipTable } from './core/helpers/config';

import initRouter from './core/lib/init/router';
import initServer from './core/lib/init/server';

import { IResourcesSettings } from './core/types/config';

import { ResourceController } from './controllers';
import { DictionariesModel, ResourceModel } from './models';

const dictionariesTable = getRelationshipTable('dictionaries');

const resourcesSettings: IResourcesSettings = {
  resource: {
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

if (!module.parent) {
  const { resources, port } = global.config;
  const router = initRouter(resources, resourcesSettings);

  initServer(router).listen(port);
}
