import path from 'path';
import { DBClient } from '../../core/lib/db-client';
import BaseModel from '../../core/models/base-model';
import { ITables } from '../../core/types/config';
import { IRelationshipsModels } from '../../core/types/model';

/**
 * Implemets the base functionality of model
 */
export default class DictionariesModel extends BaseModel {
  constructor(
    tables: ITables,
    relationshipsModels?: IRelationshipsModels,
    schemaPath?: string,
    limit?: number,
    dbClient?: DBClient
  ) {
    super(tables, relationshipsModels, schemaPath || path.resolve(__dirname + '/schema.json'), limit, dbClient);
  }
}
