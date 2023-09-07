// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { getRegisteredBlockExecutors } from '@jvalue/jayvee-execution';
import {
  BlockMetaInformation,
  createJayveeServices,
  initializeWorkspace,
  isBuiltinBlocktypeDefinition,
  isJayveeModel,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import { useStdExtension } from './interpreter';

async function getAllBuiltinBlocktypes(): Promise<BlockMetaInformation[]> {
  const allBuiltinBlocktypes: BlockMetaInformation[] = [];
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);
  const documentService = services.shared.workspace.LangiumDocuments;

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      parsedDocument.blocktypes.forEach((blocktypeDefinition) => {
        if (!isBuiltinBlocktypeDefinition(blocktypeDefinition)) {
          return;
        }
        if (BlockMetaInformation.canBeWrapped(blocktypeDefinition)) {
          allBuiltinBlocktypes.push(
            new BlockMetaInformation(blocktypeDefinition),
          );
        }
      });
    });
  return allBuiltinBlocktypes;
}

describe('std extension', () => {
  it('should provide matching block executors for builtin block types', async () => {
    useStdExtension();
    (await getAllBuiltinBlocktypes()).forEach(
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
