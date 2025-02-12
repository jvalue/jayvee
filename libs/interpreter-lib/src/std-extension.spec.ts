// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import {
  type BlockTypeWrapper,
  createJayveeServices,
  getAllReferenceableBlockTypes,
  initializeWorkspace,
  isBuiltinBlockTypeDefinition,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

async function loadAllBuiltinBlockTypes(): Promise<BlockTypeWrapper[]> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);
  return getAllReferenceableBlockTypes(
    services.shared.workspace.LangiumDocuments,
    services.WrapperFactories,
    (blockType) => isBuiltinBlockTypeDefinition(blockType),
  );
}

describe('std extension', () => {
  it('should provide matching block executors for built-in block types', async () => {
    (await loadAllBuiltinBlockTypes()).forEach(
      (blockType: BlockTypeWrapper) => {
        const execExtension = new StdExecExtension();
        console.info(`Looking for executor for block type ${blockType.type}`);
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
