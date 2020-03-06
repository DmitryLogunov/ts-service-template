import PaginationHelper from '@/src/core/controllers/helpers/pagination-helper';
const paginationHelper = new PaginationHelper();

test('All links', () => {
  const page = 3;
  const limit = 15;
  const count = 123;
  const links = paginationHelper.getLinks(page, limit, count, {});

  expect(links.self).toBeDefined();
  expect(links.first).toBeDefined();
  expect(links.prev).toBeDefined();
  expect(links.next).toBeDefined();
  expect(links.last).toBeDefined();
});

test('Without NEXT', () => {
  const page = 8;
  const limit = 15;
  const count = 123;
  const links = paginationHelper.getLinks(page, limit, count, {});

  expect(links.self).toBeDefined();
  expect(links.first).toBeDefined();
  expect(links.prev).toBeDefined();
  expect(links.last).toBeDefined();
  expect(links.self).toBe(links.last);
});

test('Without PREV', () => {
  const page = 0;
  const limit = 15;
  const count = 123;
  const links = paginationHelper.getLinks(page, limit, count, {});

  expect(links.self).toBeDefined();
  expect(links.first).toBeDefined();
  expect(links.next).toBeDefined();
  expect(links.last).toBeDefined();
  expect(links.self).toBe(links.first);
});
