import { throws } from 'smid';

import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', process.cwd() + '/tests/data/config/');

import ContextRequestParser from '@/src/core/controllers/helpers/context-request-parser';
const contextRequestParser = new ContextRequestParser({} as any);

test('Default Structure', async done => {
  const params = { 'filter[id]': '1' };
  const filter = contextRequestParser.parseParams(params);

  expect(filter.length).toBeDefined();
  expect(filter[0].field).toBeDefined();
  expect(filter[0].operand).toBeDefined();
  expect(filter[0].values).toBeDefined();
  expect(filter[0].values.length).toBeDefined();
  expect(filter[0].field).toBe('id');
  expect(filter[0].operand).toBe('eq');
  expect(filter[0].values[0]).toBe(params['filter[id]']);

  done();
});

test('Invalid Query', async done => {
  let params: any = null;
  let error: any = null;

  params = { 'filter[id][notOperand]': 1 };
  error = await throws(async () => await contextRequestParser.parseParams(params));
  expect(error.message).toBeDefined();
  expect(error.message).toBe('invalid query operand - notOperand');

  params = { 'invalid[id]': 1 };
  error = await throws(async () => await contextRequestParser.parseParams(params));
  expect(error.message).toBeDefined();
  expect(error.message).toBe('invalid query parameter - invalid[id]');

  done();
});

test('Operands', async done => {
  const params = {
    'filter[eq][eq]': 1,
    'filter[gt][gt]': 5,
    'filter[gte][gte]': 6,
    'filter[lt][lt]': 3,
    'filter[lte][lte]': 4,
    'filter[ne][ne]': 2
  };
  const filter = contextRequestParser.parseParams(params as any);

  for (const item of filter) {
    expect(item.field).toBeDefined();
    expect(item.operand).toBeDefined();
    expect(item.values).toBeDefined();
    expect(item.values.length).toBeDefined();
  }

  done();
});

test('Multiple Operands', async done => {
  const params = { 'filter[id]': ['1', '2', '3'], 'filter[symbol][ne]': ['4', '5', '6'] };
  const filter = contextRequestParser.parseParams(params as any);

  expect(filter.length).toBeDefined();

  for (const i in filter) {
    if (filter.hasOwnProperty(i)) {
      expect(filter[i].field).toBeDefined();
      expect(filter[i].operand).toBeDefined();
      expect(filter[i].values).toBeDefined();
      expect(filter[i].values.length).toBeDefined();
    }
  }

  expect(filter[0].operand).toBe('in');
  expect(filter[1].operand).toBe('nin');

  expect(String(filter[0].values)).toBe(String(['1', '2', '3']));
  expect(String(filter[1].values)).toBe(String(['4', '5', '6']));

  done();
});
