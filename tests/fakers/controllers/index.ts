import BaseResourceController from '../../../src/core/controllers/base-resource-controller';
import BaseModel from '../../../src/core/models/base-model';

export default class Controller extends BaseResourceController {
  constructor(resource: string, model: BaseModel, limit?: number) {
    super(resource, model, limit);
  }
}
