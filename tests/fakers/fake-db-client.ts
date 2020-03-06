/* tslint:disable */
import fs from 'fs';
import Sqlite3 from 'sqlite3';

const sqlite3 = Sqlite3.verbose();

/**
 * Implemets the fake class for DBClient
 */

export default class FakeDBClient {
  private sqliteFilePath: string;
  private dbClient: any;

  /**
   * FakeDBClient constructor
   *
   * @param {*} initSQLDumpPath  optional, path to SQL init dump
   * @param {*} sqliteFilePath   otpional, path to local SQLite file; as default the SQLite base creates in ':memory:' mode
   */
  constructor(initSQLDumpPath?: string, sqliteFilePath?: string) {
    this.sqliteFilePath = sqliteFilePath;

    const storage = sqliteFilePath || ':memory:';
    try {
      this.dbClient = new sqlite3.Database(storage);
      console.log('Test SQLite DB is established.');

      if (initSQLDumpPath) {
        this.initDB(initSQLDumpPath);
        console.log('The init SQL dump has been uploaded');
      }
    } catch (e) {
      console.log('Error: Test SQLite DB has not been established!');
    }
  }

  /**
   * Removes SQLite file storage if it exists
   */
  removeFileStorage() {
    if (!this.sqliteFilePath || !fs.existsSync(this.sqliteFilePath)) return;
    fs.unlinkSync(this.sqliteFilePath);
  }

  /**
   * Closes DB
   */
  close() {
    this.dbClient.close();
  }

  /**
   *  Initiates DB with sqlDump from file
   *
   * @param {*} initSQLDumpPath
   */
  initDBFromListQueries(initSQLDumpPath: string) {
    if (!initSQLDumpPath) return;

    const sqlInitDump = fs.readFileSync(initSQLDumpPath, 'utf8');
    const queries = sqlInitDump.split(';\n');

    let dumpQueriesIndex = 0;
    this.dbClient.serialize(() => {
      for (var i = 0; i < queries.length; i++) {
        try {
          console.log(`Run query: ${queries[i]}`);
          this.dbClient.run(queries[i]);
          dumpQueriesIndex += 1;
        } catch (e) {
          console.log(`Error: there is mistake inSQL query: '${queries[i]}'`);
        }
      }
    });

    return dumpQueriesIndex;
  }

  /**
   *  Initiates DB with sqlDump from file
   *
   * @param {*} initSQLDumpPath
   */
  initDB(initSQLDumpPath: string) {
    if (!initSQLDumpPath) return;

    const sqlInitDump = fs.readFileSync(initSQLDumpPath, 'utf8');

    try {
      this.dbClient.exec(sqlInitDump);
    } catch (e) {
      console.log('Error: there is mistake with executing initial database sql dump');
    }
  }

  /**
   * Implements executing SQL query to database
   *
   * @param sql
   * @returns Promise<IDBResult>
   */
  query(sql: string, params?: string[]) {
    return new Promise((resolve: any, reject: any) => {
      this.dbClient.serialize(() => {
        if (sql.match(/SELECT/)) return this.select(sql, params, resolve);
        if (sql.match(/INSERT/)) return this.insert(sql, params, resolve, reject);
        return this.run(sql, params, resolve, reject); /* UPDATE, CREATE, DELETE */
      });
    });
  }

  /**
   * Select query
   */
  select(sql: string, params: any, resolve: any) {
    if (sql.match(/CONCAT/)) {
      const parsedSQL = sql.match(/CONCAT((.+),\s*' ',\s*(.+)(.+))\s+LIKE/);
      const firstNameItem = parsedSQL[2].replace('(', '');
      const lastNameItem = parsedSQL[3];
      sql = sql.replace(`CONCAT(${firstNameItem}, ' ', ${lastNameItem})`, `${firstNameItem} || ' ' || ${lastNameItem}`);
    }
    if (sql.match(/REGEXP/)) {
      sql = sql.replace('REGEXP', 'LIKE');
      params[0] = `%${params[0]}%`;
    }
    this.dbClient.all(sql, params, (err: any, rows: any) => {
      if (err) {
        resolve({ data: [], status: false, message: err.message });
      }
      resolve({ data: rows, status: true });
    });
  }

  /**
   * Insert new row
   */
  insert(sql: string, params: any, resolve: any, reject: any) {
    return this.dbClient.run(sql, params, (err: any) => {
      if (err) {
        console.log(
          `Error: there is mistake in SQL query. SQL: '${sql}', params: '${JSON.stringify(params)}', error: ${err}`
        );
        reject(err);
      }

      this.query(`SELECT LAST_INSERT_ROWID() as last_insert_id`).then((rows: any) => {
        if (!(rows.data && rows.data.length > 0 && rows.data[0] && rows.data[0]['last_insert_id'] !== null)) {
          const paramsLog = params ? `, params: '${JSON.stringify(params)}'` : '';
          console.log(
            `Error: SQL request haven't been succefully executed (it's not possible to get last insert id). SQL: '${sql}' ${paramsLog}, error: ${err}`
          );
          reject(err);
        }
        const insertId = parseInt(rows.data[0]['last_insert_id']);
        resolve({ data: { insertId }, status: true });
      });
    });
  }

  /**
   * Execute CREATE, UPDATE and DELETE queries
   */
  run(sql: string, params: any, resolve: any, reject: any) {
    const dbRunHandler = (sql: string, params: any, resolve: any, reject: any) => {
      this.dbClient.run(sql, params, (err: any) => {
        if (err) {
          console.log(
            `Error: there is mistake in SQL query. SQL: '${sql}', params: '${JSON.stringify(params)}', error: ${err}`
          );
          reject(err);
        }
        resolve({ data: { affectedRows: 1, changedRows: 1 }, status: true });
      });
    };

    if (sql.match(/UPDATE/)) {
      let selectSQL = sql.replace(/[\s]*SET([\s]*[`]*[a-zA-Z_]+[`]*=\?[,]*[\s]*)+/, ' ');
      const parsedSQL = sql.match(/([\s]*[`]*[a-zA-Z_]+[`]*=\?[,]*[\s]*)+/);
      const setParamsList = parsedSQL[0].split('=?');
      selectSQL = selectSQL.replace('UPDATE ', 'SELECT COUNT(*) as cnt FROM ');
      let whereParams = Object.assign([], params);
      whereParams.splice(0, setParamsList.length - 1);

      this.query(selectSQL, whereParams).then((rows: any) => {
        if (rows.data && rows.data.length > 0 && rows.data[0]['cnt'] !== null && parseInt(rows.data[0]['cnt']) > 0) {
          dbRunHandler(sql, params, resolve, reject);
        } else {
          resolve({ data: { affectedRows: 1, changedRows: 1 }, status: true });
        }
      });
    }

    dbRunHandler(sql, params, resolve, reject);
  }
}
