import initConfig from '@/src/core/lib/init/config';
global.config = initConfig('config.sample-resource.yaml', `${process.cwd()}/tests/data/config`);

import { getRelationshipTable } from '@/src/core/helpers/config';

test(`Check 'core/helpers/config#getRelationshipTable'`, async () => {
  const dictionariesTable = getRelationshipTable('dictionaries');
  expect(dictionariesTable).toBe('dictionaries');
});
