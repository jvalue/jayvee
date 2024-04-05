// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import {
  BlockTypeWrapper,
  createJayveeServices,
  getAllBuiltinBlocktypes,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

async function loadAllBuiltinBlocktypes(): Promise<BlockTypeWrapper[]> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);
  return getAllBuiltinBlocktypes(
    services.shared.workspace.LangiumDocuments,
    services.WrapperFactories,
  );
}

describe('std extension', () => {
  it('should provide matching block executors for builtin block types', async () => {
    (await loadAllBuiltinBlocktypes()).forEach(
      (blockType: BlockTypeWrapper) => {
        const execExtension = new StdExecExtension();
        console.info(`Looking for executor for blocktype ${blockType.type}`);
        const matchingBlockExecutorClass =
          execExtension.getExecutorForBlockType(blockType.type);

        expect(matchingBlockExecutorClass).toBeDefined();
        assert(matchingBlockExecutorClass !== undefined);

        const matchingBlockExecutor = new matchingBlockExecutorClass();

        expect(matchingBlockExecutor.inputType).toEqual(blockType.inputType);
        expect(matchingBlockExecutor.outputType).toEqual(blockType.outputType);
      },
    );
  });
});
