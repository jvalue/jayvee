// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { ValidationResult, validationHelper } from '../../test/langium-utils';
import { JayveeServices, createJayveeServices } from '../jayvee-module';

import { getAvailableConstraintMetaInf } from './constraint-registry';

describe('Validation of builtin examples of ConstraintMetaInformation', () => {
  let services: JayveeServices;
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  beforeAll(() => {
    // TODO: fix tests after removing TestExtension

    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    // Create validation helper for language services
    validate = validationHelper(services);
  });

  it.each(
    getAvailableConstraintMetaInf().map((metaInfClass) => {
      const metaInf = new metaInfClass();
      return [metaInf.type, metaInf];
    }),
  )(
    'should have no error on %s example validation',
    async (type, constraintMetaInf) => {
      for (const example of constraintMetaInf.docs.examples ?? []) {
        const validationResult = await validate(example.code);
        const diagnostics = validationResult.diagnostics;

        expect(diagnostics).toHaveLength(0);
      }
    },
  );
});
