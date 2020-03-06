process.env.NODE_ENV = null;

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.tests.yaml', `${process.cwd()}/tests/data/config`);

const logRelativeFilenamePath = 'tests/data/http.log';

global.config.logSettings = {
  colorize: false,
  filename: logRelativeFilenamePath,
  format: 2,
  level: 'debug',
  transports: 'file'
};

import fs from 'fs';
import { promisify } from 'util';

import httpLogger from '@/src/core/middlewares/http-logger';

const readFile = promisify(fs.readFile);

const clearTestLogs = (path: string) => {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};

afterAll(() => {
  clearTestLogs(`${process.cwd()}/${logRelativeFilenamePath}`);
});

const OUTPUT_LOG_TIMEOUT = 1000;

test('Not Found Middleware', async done => {
  const guidHeader = 'test';
  const ctx: any = {
    guidHeader,
    header: {
      [guidHeader]: 123
    },
    length: 42,
    method: 'GET',
    originalUrl: 'urlTest',
    status: 200
  };

  const message = `${ctx.method} ${ctx.originalUrl} :: ${ctx.status} :: guID - ${ctx.header[guidHeader]} :: 42b`;

  const next = () => Promise.resolve();

  await httpLogger(ctx, next);

  setTimeout(async () => {
    const outputLogData = await readFile(`${process.cwd()}/${logRelativeFilenamePath}`, 'utf8');
    const outputLog = JSON.parse(outputLogData);

    expect(outputLog.level).toBe('info');
    expect(outputLog.message).toBeDefined();
    expect(outputLog.message.includes(message)).toBe(true);

    done();
  }, OUTPUT_LOG_TIMEOUT);
});
