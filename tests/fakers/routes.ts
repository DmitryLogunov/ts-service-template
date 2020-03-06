import compose from 'koa-compose';
import Router from 'koa-router';

import Controller from './controllers';
import DictionariesModel from './models/dictionaries-model';
import ResourceModel from './models/resource-model';

/** defining test resource */
const resource = 'sample-resource';

const tables = { mainTable: 'sample-resource', actionTable: 'sample-resource' };
const relationshipModels = {
  dictionaries: {
    model: new DictionariesModel({ mainTable: 'dictionaries' }),
    titleColumn: 'title'
  }
};

const model = new ResourceModel(tables, relationshipModels);
const controller = new Controller(resource, model);

const parseQuery = controller.parseQuery.bind(controller);
const parseId = controller.parseId.bind(controller);
const parseBody = controller.parseBody.bind(controller);
const sendResponse = controller.sendResponse.bind(controller);

const select = controller.select.bind(controller);
const create = controller.create.bind(controller);
const update = controller.update.bind(controller);
const del = controller.delete.bind(controller);

export default () => {
  const middlewares = [];

  const router = new Router();
  router.prefix(`/${resource}`);

  router.get('/', parseQuery, select, sendResponse);
  router.get('/:id', parseId, select, sendResponse);
  router.post('/', parseBody, create, sendResponse);
  router.patch('/:id', parseId, parseBody, update, sendResponse);
  router.delete('/:id', parseId, del, sendResponse);

  middlewares.push(router.routes());
  if (router.allowedMethods) {
    middlewares.push(router.allowedMethods());
  }

  return compose(middlewares);
};
