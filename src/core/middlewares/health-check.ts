import { Context } from 'koa';

export default async (ctx: Context, next: () => Promise<any>) => {
  const itemsPath = ctx.path.split('/');
  const condition = ctx.method === 'GET' && itemsPath.length === 3 && itemsPath[2] === ('healthcheck');
  if (condition) {
    ctx.status = 200;
    ctx.body = { info: 'OK' };
    return;
  }

  await next()
};
