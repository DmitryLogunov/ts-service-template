import { IDBSettings } from '../../types/config';
import { IDBClient, IDBResult } from '../../types/db-client';
import { MySQLClient } from './clients/mysql';

/**
 * Implemets the base functionality of database client
 */
export class DBClient implements IDBClient {
  private dbClient: IDBClient;

  constructor(dbSettings: IDBSettings, dbClient?: DBClient) {
    if (dbClient) {
      this.dbClient = dbClient;
      return;
    }

    this.dbClient = new MySQLClient(dbSettings);
  }

  /**
   * Closes all connections
   */
  public async close() {
    await this.dbClient.close();
  }

  /**
   * Implements executing SQL query to database
   *
   * @param sql
   * @returns Promise<IDBResult>|null
   */

  public async query(sql: string, values: string[] = []): Promise<IDBResult> {
    const result = this.dbClient.query(sql, values);
    return result;
  }
}
