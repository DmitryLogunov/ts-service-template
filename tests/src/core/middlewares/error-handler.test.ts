import errorHandler from '@/src/core/middlewares/error-handler';

test('Error Handler#Reject', async () => {
  const ctx: any = {};

  const message = 'Test error';
  const next = () =>
    new Promise((_, rejected) => {
      rejected({ message });
    });

  await errorHandler(ctx, next);

  expect(typeof errorHandler).toBe('function');
  expect(ctx.status).toBe(500);
  expect(ctx.body).toBeDefined();
  expect(ctx.body.errors).toBeDefined();
  expect(ctx.body.errors[0].status).toBe(500);
  expect(ctx.body.errors[0].detail).toBe(message);
});

test('Error Handler#Resolve', async () => {
  const ctx: any = {};

  const promise = () =>
    new Promise(resolve => {
      resolve();
    });

  await errorHandler(ctx, promise);
  expect(typeof errorHandler).toBe('function');
  expect(ctx.status).toBeUndefined();
  expect(ctx.body).toBeUndefined();
});
