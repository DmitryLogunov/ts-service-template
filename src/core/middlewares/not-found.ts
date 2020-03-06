import { Context } from 'koa';
import { errors, errorTitles } from '../application-settings';
import ApplicationErrors from '../helpers/application-error';

export default async (ctx: Context) => {
  const path = `${ctx.request.method} ${ctx.request.path}`;
  const status = 404;

  throw new ApplicationErrors(
    errors.CUSTOM_ERROR_RESPONSE(`No endpoint matched your request: ${path}`, status, errorTitles[status])
  );
};
