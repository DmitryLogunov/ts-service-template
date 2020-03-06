import notFound from '@/src/core/middlewares/not-found';

import { throws } from 'smid';

test('Not Found Middleware', async () => {
  const ctx: any = {
    request: {
      method: 'GET',
      path: '/test'
    }
  };

  const errors: any = await throws(async () => await notFound(ctx));

  expect(errors.message).toBeDefined();
  expect(errors.message).toBe('No endpoint matched your request: GET /test');
  expect(errors.status).toBe(404);
  expect(errors.title).toBe('not found');
});
