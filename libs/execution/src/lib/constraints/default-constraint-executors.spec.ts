// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  createJayveeServices,
  getAllBuiltinConstraintTypes,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import {
  getRegisteredConstraintExecutors,
  registerDefaultConstraintExecutors,
} from './constraint-executor-registry';

describe('default constraint executors', () => {
  it('should include executors for all constraint types', async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await initializeWorkspace(services);

    registerDefaultConstraintExecutors();

    getAllBuiltinConstraintTypes(
      services.shared.workspace.LangiumDocuments,
    ).forEach((metaInf) => {
      const matchingConstraintExecutorClass =
        getRegisteredConstraintExecutors().find((c) => c.type === metaInf.type);

      expect(matchingConstraintExecutorClass).toBeDefined();
    });
  });
});
