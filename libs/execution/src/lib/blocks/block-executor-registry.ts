import { strict as assert } from 'assert';

import { Block, Registry } from '@jvalue/language-server';

import { BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';

const blockExecutorRegistry = new Registry<BlockExecutorClass>();

export function registerBlockExecutor(executorClass: BlockExecutorClass) {
  blockExecutorRegistry.register(executorClass.type, executorClass);
}

export function getRegisteredBlockExecutors(): BlockExecutorClass[] {
  return [...blockExecutorRegistry.getAll()];
}

export function createBlockExecutor(block: Block): BlockExecutor {
  const blockType = block.type.name;
  const blockExecutor = blockExecutorRegistry.get(blockType);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType}`,
  );

  return new blockExecutor();
}
