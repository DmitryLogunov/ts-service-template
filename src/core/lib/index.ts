import Logger from './logger/logger';

export const logger: Logger = new Logger((global.config && global.config.logSettings) || null);
export { DBClient } from './db-client';
