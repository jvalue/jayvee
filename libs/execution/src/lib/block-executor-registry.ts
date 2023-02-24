import { strict as assert } from 'assert';

import { Block } from '@jayvee/language-server';

import { BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';
import { Logger } from './logger';

const registeredBlockExecutors = new Map<string, BlockExecutorClass>();

export function registerBlockExecutor(blockExecutor: BlockExecutorClass) {
  const blockType = new blockExecutor().blockType;
  assert(
    !registeredBlockExecutors.has(blockType),
    `Multiple executors were registered for block type ${blockType}`,
  );

  registeredBlockExecutors.set(blockType, blockExecutor);
}

export function getRegisteredBlockExecutors(): BlockExecutorClass[] {
  return [...registeredBlockExecutors.values()];
}

export function createBlockExecutor(
  block: Block,
  runtimeParameters: Map<string, string | number | boolean>,
  logger: Logger,
): BlockExecutor {
  const blockType = block.type.name;
  const blockExecutor = registeredBlockExecutors.get(blockType);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType}`,
  );

  const blockExecutorInstance = new blockExecutor();
  blockExecutorInstance.block = block;
  blockExecutorInstance.runtimeParameters = runtimeParameters;
  blockExecutorInstance.logger = logger;

  return blockExecutorInstance;
}
