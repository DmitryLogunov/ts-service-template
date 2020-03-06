import { Context } from 'koa';
import stackTrace from 'stack-trace';
import { logger } from '../lib';

import ApplicationError from '../helpers/application-error';
const applicationError = new ApplicationError();

export default async (ctx: Context, next: () => Promise<any>) => {
  try {
    await next();
  } catch (e) {
    logger.error(`Error caught in handler`, { message: e.detail || e.message }, stackTrace.get());

    const { status, body } = applicationError.parseError(e);

    ctx.status = status;
    ctx.body = body;
  }
};
