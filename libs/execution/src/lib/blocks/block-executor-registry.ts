// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { BlockDefinition, Registry } from '@jvalue/jayvee-language-server';

import { BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';

const blockExecutorRegistry = new Registry<BlockExecutorClass>();

export function registerBlockExecutor(executorClass: BlockExecutorClass) {
  blockExecutorRegistry.register(executorClass.type, executorClass);
}

export function getRegisteredBlockExecutors(): BlockExecutorClass[] {
  return [...blockExecutorRegistry.getAll()];
}

export function createBlockExecutor(block: BlockDefinition): BlockExecutor {
  const blockType = block.type.ref?.name;
  assert(blockType !== undefined);
  const blockExecutor = blockExecutorRegistry.get(blockType);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType}`,
  );

  return new blockExecutor();
}
