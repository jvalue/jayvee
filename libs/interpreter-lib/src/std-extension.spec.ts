// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { getRegisteredBlockExecutors } from '@jvalue/jayvee-execution';
import {
  BlockMetaInformation,
  createJayveeServices,
  getAllBuiltinBlocktypes,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import { useStdExtension } from './interpreter';

async function loadAllBuiltinBlocktypes(): Promise<BlockMetaInformation[]> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);
  return getAllBuiltinBlocktypes(services.shared.workspace.LangiumDocuments);
}

describe('std extension', () => {
  it('should provide matching block executors for builtin block types', async () => {
    useStdExtension();
    (await loadAllBuiltinBlocktypes()).forEach(
      (metaInf: BlockMetaInformation) => {
        console.info(`Looking for executor for blocktype ${metaInf.type}`);
        const matchingBlockExecutorClass = getRegisteredBlockExecutors().find(
          (blockExecutorClass) => blockExecutorClass.type === metaInf.type,
        );

        expect(matchingBlockExecutorClass).toBeDefined();
        assert(matchingBlockExecutorClass !== undefined);

        const matchingBlockExecutor = new matchingBlockExecutorClass();

        expect(matchingBlockExecutor.inputType).toEqual(metaInf.inputType);
        expect(matchingBlockExecutor.outputType).toEqual(metaInf.outputType);
      },
    );
  });
});
