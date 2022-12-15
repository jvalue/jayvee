import { Block, BlockType } from '@jayvee/language-server';

import { BlockExecutor } from '../block-executor';

export interface BlockExecutorType<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}

const registeredBlockExecutors = new Map<BlockType, BlockExecutorType>();

export function registerBlockExecutor(blockExecutor: BlockExecutorType) {
  const blockType = new blockExecutor().blockType;
  if (registeredBlockExecutors.has(blockType)) {
    throw new Error(
      `Multiple executors were registered for block type ${blockType}`,
    );
  }
  registeredBlockExecutors.set(blockType, blockExecutor);
}

export function createBlockExecutor(
  block: Block,
  runtimeParameters: Map<string, string | number | boolean>,
): BlockExecutor {
  const blockExecutor = registeredBlockExecutors.get(block.type);
  if (blockExecutor === undefined) {
    throw new Error(`No executor was registered for block type ${block.type}`);
  }
  const blockExecutorInstance = new blockExecutor();
  blockExecutorInstance.block = block;
  blockExecutorInstance.runtimeParameters = runtimeParameters;

  return blockExecutorInstance;
}
