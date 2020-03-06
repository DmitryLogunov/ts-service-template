import BaseResourceController from '../core/controllers/base-resource-controller';
import BaseModel from '../core/models/base-model';

export default class ResourceController extends BaseResourceController {
  constructor(resource: string, model: BaseModel, limit?: number) {
    super(resource, model, limit);
  }
}
