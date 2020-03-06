import { find } from 'lodash';
import { IRelationshipTable } from '../types/config';

/**
 * Returns relationship table
 *
 * @param relationshipName
 */
export const getRelationshipTable = (relationshipTableName: string): string | null => {
  const wantedRelationship: IRelationshipTable = find(global.config.relationships, (rel: IRelationshipTable) => {
    return rel.name === relationshipTableName;
  });

  if (!wantedRelationship) {
    return;
  }

  return wantedRelationship.table;
};
