import Http from 'http';
import Koa from 'koa';
import body from 'koa-body';
import { ComposedMiddleware } from 'koa-compose';
import stackTrace from 'stack-trace';
import { logger } from '..';
import middleware from '../../middlewares';

/**
 * Initialize Koa server
 *
 * @param {() => ComposedMiddleware<any>} router
 * @returns {Http.Server}
 */
export default (router: () => ComposedMiddleware<any>): Http.Server => {
  logger.debug('Creating server...');
  const app: Koa = new Koa();

  app
    .use(middleware.errorHandler)
    .use(middleware.httpLogger)
    .use(middleware.healthcheck)
    .use(body({ multipart: true }))
    .use(middleware.parseUserID)
    .use(router())
    .use(middleware.notFound);

  const { dbClient, config } = global;
  const { reqGuidHeader, port } = config;

  app.context.guidHeader = reqGuidHeader;

  const server = Http.createServer(app.callback())
    .on('listening', () => logger.info(`Server is listening http://localhost:${port}`))
    .on('error', e => {
      logger.error(`Error while listening port ${port}`, { message: e.message }, stackTrace.get());
      process.exit(1);
    })
    .on('close', () => {
      if (dbClient && dbClient.close) {
        dbClient.close();
      }
      logger.debug('Server is closing, bye...');
    });

  logger.debug('Server created, ready to listen...');
  return server;
};
