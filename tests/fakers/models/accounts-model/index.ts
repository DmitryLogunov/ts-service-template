import path from 'path';
import BaseModel from '../../../../src/core/models/base-model';

export default class AccountsModel extends BaseModel {
  constructor(tables: any, relationshipsModels?: any, schemaPath?: string, limit?: number, dbClient?: any) {
    super(tables, relationshipsModels, schemaPath || path.resolve(__dirname + '/schema.json'), limit, dbClient);
  }
}
