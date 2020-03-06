import stackTrace from 'stack-trace';
import { DBClient, logger } from '..';
import { IDBSettings } from '../../types/config';
import { IDBClient } from '../../types/db-client';

/**
 * Initialize database client
 *
 * @param {IDBSettings} dbSettings
 * @returns {IDBClient}
 */
export default (dbSettings: IDBSettings): IDBClient => {
  const dbClient: IDBClient = new DBClient(dbSettings);

  if (!dbClient) {
    logger.error(`Database client is not established!`, null, stackTrace.get());
    process.exit(1);
  }

  return dbClient;
};
