process.env.NODE_ENV = null;

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.tests.yaml', `${process.cwd()}/tests/data/config`);

import fs from 'fs';
import stackTrace from 'stack-trace';
import uniqid from 'uniqid';
import { promisify } from 'util';

import Logger from '@/src/core/lib/logger/logger';

const readFile = promisify(fs.readFile);
const logFIlePath = `${process.cwd()}/combined.log`;

const clearTestLogs = (path: string) => {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};

const OUTPUT_LOG_TIMEOUT = 1000;

beforeAll(() => {
  clearTestLogs(logFIlePath);
});

afterAll(() => {
  clearTestLogs(logFIlePath);
});

test('Checking logger#info', async done => {
  const logger = new Logger({
    colorize: false,
    format: 2,
    level: 'debug',
    transports: 'file'
  });

  const message = uniqid();
  const params = { a: uniqid(), b: uniqid() };
  const stacktrace = stackTrace.get();
  const fileName = stacktrace[0]
    .getFileName()
    .split('/')
    .slice(-1)[0];
  const line = stacktrace[0].getLineNumber();

  logger.info(message, params, stacktrace);

  setTimeout(async () => {
    const outputLogData = await readFile(logFIlePath, 'utf8');
    const outputLog = JSON.parse(outputLogData);

    expect(outputLog.level).toBe('info');
    expect(outputLog.message).toBe(message);
    expect(outputLog.params).toEqual(params);
    expect(outputLog.timestamp).not.toBeUndefined();
    expect(outputLog.label).toBe(`${fileName}:${line}`);
    done();
  }, OUTPUT_LOG_TIMEOUT);
});
