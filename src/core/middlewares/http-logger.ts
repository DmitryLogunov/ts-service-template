import bytes from 'bytes';
import { Context } from 'koa';
import { logger } from '../lib';

export default async (ctx: Context, next: () => Promise<any>) => {
  const start = Date.now();

  try {
    await next();
  } finally {
    const end = Date.now() - start;
    const guID = ctx.header[ctx.guidHeader] || 'none';
    const startMessage = `${ctx.method} ${ctx.originalUrl} :: ${ctx.status} :: guID - ${guID}`;
    const length = bytes(ctx.length || 0).toLowerCase();

    logger.info(`${startMessage} :: ${length} :: ${end}ms`);
  }
};
