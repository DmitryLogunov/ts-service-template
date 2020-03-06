/* tslint:disable */

declare namespace NodeJS {
  interface Global {
    dbClient: import('../core/types/db-client').IDBClient;
    config: import('../core/types/config').IConfig;
  }
}

declare module 'js-yaml';
declare module 'stack-trace';
declare module 'is-number';
declare module 'bytes';
declare module 'lodash';

declare module 'uniqid';
declare module 'randomstring';
declare module 'supertest';
declare module 'sqlite3';
declare module 'mkdirp';
