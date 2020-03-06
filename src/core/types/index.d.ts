import BaseResourceController from '../controllers/base-resource-controller';
import { DBClient } from '../lib';
import BaseModel from '../models/base-model';
import { IConfig } from './config';
import { IResourcesSettings } from './config';
import { IDBClient, IDBResult } from './db-client';

import initConfig from '../lib/init/config';
import initDB from '../lib/init/db';
import initServer from '../lib/init/server';

export {
  BaseResourceController,
  IConfig,
  IDBClient,
  IDBResult,
  IResourcesSettings,
  initConfig,
  initDB,
  initServer,
  DBClient,
  BaseModel
};
