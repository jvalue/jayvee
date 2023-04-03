// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  getRegisteredConstraintMetaInformation,
  registerConstraints,
} from '@jvalue/jayvee-language-server';

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
