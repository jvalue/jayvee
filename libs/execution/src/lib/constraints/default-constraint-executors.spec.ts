import {
  getRegisteredConstraintMetaInformation,
  registerConstraints,
} from '@jvalue/language-server';

import {
  getRegisteredConstraintExecutors,
  registerDefaultConstraintExecutors,
} from './constraint-executor-registry';

describe('default constraint executors', () => {
  registerConstraints();
  registerDefaultConstraintExecutors();

  getRegisteredConstraintMetaInformation().forEach((metaInf) => {
    it(`should include an executor for ${metaInf.type}`, () => {
      const matchingConstraintExecutorClass =
        getRegisteredConstraintExecutors().find((c) => c.type === metaInf.type);

      expect(matchingConstraintExecutorClass).toBeDefined();
    });
  });
});
