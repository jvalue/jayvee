// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  createJayveeServices,
  getAllBuiltinConstraintTypes,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import { DefaultConstraintExtension } from './constraint-executor-extension';

describe('default constraint extension', () => {
  it('should include executors for all constraint types', async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await initializeWorkspace(services);

    const defaultConstraintExtension = new DefaultConstraintExtension();

    getAllBuiltinConstraintTypes(
      services.shared.workspace.LangiumDocuments,
      services.WrapperFactories,
    ).forEach((constraintType) => {
      const matchingConstraintExecutorClass = defaultConstraintExtension
        .getConstraintExecutors()
        .find((c) => c.type === constraintType.type);

      expect(matchingConstraintExecutorClass).toBeDefined();
    });
  });
});
