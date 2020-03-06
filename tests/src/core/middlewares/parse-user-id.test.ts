import { get } from 'lodash';
import uniqid from 'uniqid';

import parseUserID from '@/src/core/middlewares/parse-user-id';

test('Parsing user-id middleware: GET (user-id header is undefined)', async done => {
  const ctx: any = {
    request: {
      body: {},
      method: 'GET'
    }
  };

  const next = async () => {
    expect(get(ctx.request, 'body.data.relationships')).toBeUndefined();
    done();
  };

  await parseUserID(ctx, next);
});

test('Parsing user-id middleware: GET (user-id header is defined)', async done => {
  const userID = uniqid();
  const ctx: any = {
    request: {
      body: {},
      header: {
        'user-id': userID
      },
      method: 'GET'
    }
  };

  const next = async () => {
    expect(get(ctx.request, 'body.data.relationships')).toBeUndefined();
    done();
  };

  await parseUserID(ctx, next);
});

test('Parsing user-id middleware: DELETE (user-id header is defined)', async done => {
  const userID = uniqid();
  const ctx: any = {
    request: {
      body: {},
      header: {
        'user-id': userID
      },
      method: 'GET'
    }
  };

  const next = async () => {
    expect(get(ctx.request, 'body.data.relationships')).toBeUndefined();
    done();
  };

  await parseUserID(ctx, next);
});

test('Parsing user-id middleware: POST => it should add relationships and define updated_by as user-id', async done => {
  const userID = uniqid();
  const ctx: any = {
    request: {
      body: {},
      header: {
        'user-id': userID
      },
      method: 'POST'
    }
  };

  const next = async () => {
    expect(get(ctx.request, 'body.data.relationships')).toBeDefined();
    expect(get(ctx.request, 'body.data.relationships.created_by.data.id')).toBe(userID);
    expect(get(ctx.request, 'body.data.relationships.created_by.data.type')).toBe('accounts');
    done();
  };

  await parseUserID(ctx, next);
});

test('Parsing user-id middleware: PATCH => it should add relationships and define created_by as user-id', async done => {
  const userID = uniqid();
  const ctx: any = {
    request: {
      body: {},
      header: {
        'user-id': userID
      },
      method: 'PATCH'
    }
  };

  const next = async () => {
    expect(get(ctx.request, 'body.data.relationships')).toBeDefined();
    expect(get(ctx.request, 'body.data.relationships.updated_by.data.id')).toBe(userID);
    expect(get(ctx.request, 'body.data.relationships.updated_by.data.type')).toBe('accounts');
    done();
  };

  await parseUserID(ctx, next);
});
