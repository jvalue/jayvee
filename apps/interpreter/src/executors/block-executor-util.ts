import { Block, BlockType } from '@jayvee/language-server';

import { BlockExecutor } from './block-executor';
import { CSVFileExtractorExecutor } from './csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './layout-validator-executor';
import { PostgresLoaderExecutor } from './postgres-loader-executor';
import { SQLiteLoaderExecutor } from './sqlite-loader-executor';

const registeredBlockExecutorFactories = new Map<
  BlockType,
  () => BlockExecutor
>();

export function registerBlockExecutorFactory(
  executorFactory: () => BlockExecutor,
) {
  registeredBlockExecutorFactories.set(
    executorFactory().blockType,
    executorFactory,
  );
}

registerBlockExecutorFactory(() => new CSVFileExtractorExecutor());
registerBlockExecutorFactory(() => new LayoutValidatorExecutor());
registerBlockExecutorFactory(() => new PostgresLoaderExecutor());
registerBlockExecutorFactory(() => new SQLiteLoaderExecutor());

export function getBlockExecutor(
  block: Block,
  runtimeParameters: Map<string, string | number | boolean>,
): BlockExecutor {
  const executorFactory = registeredBlockExecutorFactories.get(block.type);
  if (executorFactory === undefined) {
    throw new Error(`No executor was registered for block type ${block.type}`);
  }
  const blockExecutor = executorFactory();
  blockExecutor.block = block;
  blockExecutor.runtimeParameters = runtimeParameters;

  return blockExecutor;
}
