import { strict as assert } from 'assert';

import { Block } from '@jayvee/language-server';

import { BlockExecutor } from './block-executor';
import { BlockExecutorType } from './block-executor-type';
import { Logger } from './logger';

const registeredBlockExecutors = new Map<string, BlockExecutorType>();

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
  logger: Logger,
): BlockExecutor {
  const blockExecutor = registeredBlockExecutors.get(block.type);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${block.type}`,
  );

  const blockExecutorInstance = new blockExecutor();
  blockExecutorInstance.block = block;
  blockExecutorInstance.runtimeParameters = runtimeParameters;
  blockExecutorInstance.logger = logger;

  return blockExecutorInstance;
}
