// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';

import { validationHelper } from '../../test/langium-utils.js';
import { getAllBuiltinConstraintTypes } from '../ast/index.js';
import { initializeWorkspace } from '../builtin-library/index.js';
import { createJayveeServices } from '../jayvee-module.js';

describe('Validation of docs examples of ConstraintTypes', () => {
  it('should have no validation errors', async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;

    await initializeWorkspace(services);

    // Create validation helper for language services
    const validate = validationHelper(services);

    const allConstraintTypes = getAllBuiltinConstraintTypes(
      services.shared.workspace.LangiumDocuments,
      services.WrapperFactories,
    );
    expect(allConstraintTypes.length).toBeGreaterThan(0);

    await Promise.all(
      allConstraintTypes.map(async (constraintType) => {
        for (const example of constraintType.docs.examples ?? []) {
          const validationResult = await validate(example.code);
          const diagnostics = validationResult.diagnostics;

          expect(diagnostics).toHaveLength(0);
        }
      }),
    );
  });
});
