import fs from 'fs';
import yaml from 'js-yaml';
import { resolve } from 'path';
import { promisify } from 'util';

import mkdirp from 'mkdirp';

const mkSubDir = promisify(mkdirp);

/**
 * Checks if sqlite db file should be created
 */
const checkNeedCreateSqliteDBFile = (sqliteDbSettings: any) => {
  if (!sqliteDbSettings) {
    return false;
  }

  if (sqliteDbSettings.strategy !== 'file') {
    return false;
  }

  return sqliteDbSettings.sqliteFile;
};

/**
 * Checks if sqlite db file should be deleted before tests start
 */
const checkNeedDeleteSqliteDBFileBeforeAll = (sqliteDbSettings: any) => {
  if (!checkNeedCreateSqliteDBFile(sqliteDbSettings)) {
    return false;
  }
  if (!fs.existsSync(resolve(process.cwd() + `/${sqliteDbSettings.sqliteFile}`))) {
    return false;
  }

  return sqliteDbSettings.deleteBeforeAll;
};

/**
 * Checks if sqlite db file should be deleted before tests start
 */
const checkNeedDeleteSqliteDBFileAfterAll = (sqliteDbSettings: any) => {
  if (!checkNeedCreateSqliteDBFile(sqliteDbSettings)) {
    return false;
  }
  if (!fs.existsSync(resolve(process.cwd() + `/${sqliteDbSettings.sqliteFile}`))) {
    return false;
  }

  return sqliteDbSettings.deleteAfterAll;
};

/**
 * Deletes sqlite db file if need
 */
export const deleteSqliteDBFileIfNeed = (sqliteDbSettings: any) => {
  if (checkNeedDeleteSqliteDBFileAfterAll(sqliteDbSettings)) {
    fs.unlinkSync(resolve(process.cwd() + `/${sqliteDbSettings.sqliteFile}`));
  }
};

/**
 * Initalizing sqlite database
 */
export const initSqliteDbSettings = () => {
  const pathToConfigfile = resolve(process.cwd()) + `/tests/sqlite-db-settings.yaml`;
  if (!fs.existsSync(pathToConfigfile)) {
    return;
  }
  const sqliteDbSettingsFile = fs.readFileSync(pathToConfigfile, 'utf8');
  const sqliteDbSettings = yaml.safeLoad(sqliteDbSettingsFile);

  if (checkNeedCreateSqliteDBFile(sqliteDbSettings)) {
    const parsedSqliteDbFilePath = sqliteDbSettings.sqliteFile.split('/');
    parsedSqliteDbFilePath.pop();
    const sqliteDbFilePath = parsedSqliteDbFilePath.join('/');
    if (!fs.existsSync(sqliteDbFilePath)) {
      mkSubDir(sqliteDbFilePath);
    }
  }

  if (checkNeedDeleteSqliteDBFileBeforeAll(sqliteDbSettings)) {
    fs.unlinkSync(resolve(process.cwd() + `/${sqliteDbSettings.sqliteFile}`));
  }

  if (sqliteDbSettings && sqliteDbSettings.strategy === 'memory') {
    delete sqliteDbSettings.sqliteFile;
  }

  return sqliteDbSettings;
};
