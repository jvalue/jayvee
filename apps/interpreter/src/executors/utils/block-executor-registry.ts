import { strict as assert } from 'assert';

import { Block, BlockType } from '@jayvee/language-server';

import { BlockExecutor } from '../block-executor';

export interface BlockExecutorType<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}

const registeredBlockExecutors = new Map<BlockType, BlockExecutorType>();

export function registerBlockExecutor(blockExecutor: BlockExecutorType) {
  const blockType = new blockExecutor().blockType;
  assert(
    !registeredBlockExecutors.has(blockType),
    `Multiple executors were registered for block type ${blockType}`,
  );

  registeredBlockExecutors.set(blockType, blockExecutor);
}

export function createBlockExecutor(
  block: Block,
  runtimeParameters: Map<string, string | number | boolean>,
): BlockExecutor {
  const blockExecutor = registeredBlockExecutors.get(block.type);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${block.type}`,
  );

  const blockExecutorInstance = new blockExecutor();
  blockExecutorInstance.block = block;
  blockExecutorInstance.runtimeParameters = runtimeParameters;

  return blockExecutorInstance;
}
