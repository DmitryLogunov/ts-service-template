import { Context } from 'koa';
import { get } from 'lodash';

export default async (ctx: Context, next: () => Promise<any>) => {
  const { method } = ctx.request;

  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const userID = get(ctx, 'request.header.user-id');

    if (userID) {
      if (!ctx.request.body.data) {
        ctx.request.body.data = {};
      }

      if (!ctx.request.body.data.relationships) {
        ctx.request.body.data.relationships = {};
      }

      switch (method) {
        case 'POST':
          ctx.request.body.data.relationships.created_by = { data: { id: userID, type: 'accounts' } };
          break;
        case 'PATCH':
          ctx.request.body.data.relationships.updated_by = { data: { id: userID, type: 'accounts' } };
          break;
        case 'PUT':
          ctx.request.body.data.relationships.updated_by = { data: { id: userID, type: 'accounts' } };
          break;
      }
    }
  }

  await next();
};
