import { Middleware } from 'koa';
import compose, { ComposedMiddleware } from 'koa-compose';
import Router from 'koa-router';

import BaseResourceController from '../../controllers/base-resource-controller';
import BaseModel from '../../models/base-model';

import { IResource, IResourcesSettings } from '../../types/config';

/**
 * Returns ComposedMiddleware object for feeding it to Koa server
 */
const buildComposedMiddleware = (
  resources: IResource[],
  resourcesSettings: any,
  additionalRouters?: Router[]
): ComposedMiddleware<any> => {
  const middlewares: Middleware[] = [];

  for (const resource of resources) {
    const router: Router = new Router();
    router.prefix(`/${resource.prefix}`);

    const tables = resource.tables;

    const relationshipModels = resourcesSettings[resource.name].relationshipModels;
    const model: BaseModel = new resourcesSettings[resource.name].model(tables, relationshipModels);
    const controller: BaseResourceController = new resourcesSettings[resource.name].controller(resource.prefix, model);

    const parseQuery: Middleware = controller.parseQuery.bind(controller);
    const parseId: Middleware = controller.parseId.bind(controller);
    const parseBody: Middleware = controller.parseBody.bind(controller);
    const sendResponse: Middleware = controller.sendResponse.bind(controller);

    const select: Middleware = controller.select.bind(controller);
    const create: Middleware = controller.create.bind(controller);
    const update: Middleware = controller.update.bind(controller);
    const del: Middleware = controller.delete.bind(controller);

    if (resource.methods.includes('GET')) {
      router.get('/', parseQuery, select, sendResponse);
      router.get('/:id', parseId, select, sendResponse);
    }

    if (resource.methods.includes('POST')) {
      router.post('/', parseBody, create, sendResponse);
    }

    if (resource.methods.includes('PATCH')) {
      router.patch('/:id', parseId, parseBody, update, sendResponse);
    }

    if (resource.methods.includes('DELETE')) {
      router.delete('/:id', parseId, del, sendResponse);
    }

    middlewares.push(router.routes());
    if (router.allowedMethods) {
      middlewares.push(router.allowedMethods());
    }
  }

  if (additionalRouters) {
    for (const additionaRouter of additionalRouters) {
      middlewares.push(additionaRouter.routes());
      if (additionaRouter.allowedMethods) {
        middlewares.push(additionaRouter.allowedMethods());
      }
    }
  }

  return compose(middlewares);
};

export default (resources: IResource[], resourcesSettings: IResourcesSettings, additionalRouters?: Router[]) => {
  return () => {
    return buildComposedMiddleware(resources, resourcesSettings, additionalRouters);
  };
};
