import { pickBy } from 'lodash';

export const removeUndefinedOnes = (obj: Record<string, any>): Record<string, any> => {
  return pickBy(obj, (v) => v !== undefined);
};
