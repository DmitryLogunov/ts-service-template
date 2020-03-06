import mysql, { Pool as IMySQLPool, PoolConnection as IMySQLPoolConnection } from 'promise-mysql';
import stackTrace from 'stack-trace';
import { logger } from '../..';
import { IDBSettings } from '../../../types/config';
import { IDBClient, IDBResult } from '../../../types/db-client';

/**
 * Implemets the base functionality of database  MySQL client
 */
export class MySQLClient implements IDBClient {
  private pool: IMySQLPool;
  private dbSettings: IDBSettings;

  constructor(dbSettings: IDBSettings) {
    this.dbSettings = dbSettings;
    this.pool = mysql.createPool(dbSettings);
    this.refreshConnection();
  }

  /**
   * Implements executing SQL query to database
   *
   * @param sql - Sql query
   * @param values - Values for sql query
   * @returns Promise<IDBResult>
   */

  public async query(sql: string, values: string[] = []): Promise<IDBResult> {
    try {
      const connection: IMySQLPoolConnection = await this.connection();
      logger.debug(sql.concat(' <- ', values.join(' :: ')));

      const data: any[] = await connection.query(sql, values);
      connection.release();
      return { data, status: true };
    } catch (e) {
      logger.error(
        "Couldn't execute query",
        {
          dbHost: this.dbSettings.host,
          message: e.message,
          sql,
          values: values.join(' :: ')
        },
        stackTrace.get()
      );
      return { data: [], status: false, message: e.message };
    }
  }

  /**
   * Closes all connections
   */
  public async close() {
    this.pool.end();
  }

  /**
   * Refreshes and checks the DB connection
   */
  private refreshConnection() {
    this.connection()
      .then((connection: IMySQLPoolConnection) => {
        if (!connection) {
          throw new Error('Database connection error');
        }
        logger.info(`The connection to database ${this.dbSettings.host} is established`);
      })
      .catch((e: Error) => {
        logger.error(
          "Couldn't connect to database",
          { message: e.message, dbHost: this.dbSettings.host },
          stackTrace.get()
        );
        process.exit(1);
      });
  }

  /**
   * Returns DB connection
   *
   * @returns Promise<IMySQLPoolConnection|null>
   */

  private async connection(): Promise<IMySQLPoolConnection | null> {
    const connection: IMySQLPoolConnection = await this.pool.getConnection();
    if (!connection) {
      logger.error("Couldn't connect to database", { dbHost: this.dbSettings.host }, stackTrace.get());
      return;
    }

    return connection;
  }
}
