import { NodeFileSystem } from 'langium/node';

import {
  Block,
  BlockType,
  Model,
  isCSVFileExtractor,
  isLayoutValidator,
  isPostgresLoader,
} from '../language-server/generated/ast';
// eslint-disable-next-line import/no-cycle
import { createOpenDataLanguageServices } from '../language-server/open-data-language-module';

import { extractAstNode, printError } from './cli-util';
import { BlockExecutor } from './executors/block-executor';
import { CSVFileExtractorExecutor } from './executors/csv-file-extractor-executor';
import * as R from './executors/execution-result';
import { LayoutValidatorExecutor } from './executors/layout-validator-executor';
import { PostgresLoaderExecutor } from './executors/postgres-loader-executor';
import { collectChildren } from './model-util';

export async function runAction(fileName: string): Promise<void> {
  const services =
    createOpenDataLanguageServices(NodeFileSystem).OpenDataLanguage;
  const model = await extractAstNode<Model>(fileName, services);
  await interpretPipelineModel(model);
}

async function interpretPipelineModel(model: Model): Promise<void> {
  const pipelineRuns: Array<Promise<void>> = [];
  for (const block of model.blocks) {
    const blockExecutor = getExecutor(block.type);
    if (!blockExecutor.hasInput()) {
      const pipelineRun = runPipeline(block);
      pipelineRuns.push(pipelineRun);
    }
  }
  await Promise.all(pipelineRuns);
}

async function runPipeline(startingBlock: Block): Promise<void> {
  let currentBlock: Block | undefined = startingBlock;
  let currentExecutor = getExecutor(currentBlock.type);
  let value = undefined;
  do {
    try {
      value = await R.dataOrThrowAsync(currentExecutor.execute(value));
    } catch (errObj) {
      if (R.isExecutionErrorDetails(errObj)) {
        printError(errObj);
        return;
      }
      throw errObj;
    }

    currentBlock = collectChildren(currentBlock)[0];
    if (currentBlock === undefined) {
      return;
    }
    currentExecutor = getExecutor(currentBlock.type);
  } while (currentExecutor.hasInput());
}

export function getExecutor(blockType: BlockType): BlockExecutor<BlockType> {
  if (isCSVFileExtractor(blockType)) {
    return new CSVFileExtractorExecutor(blockType);
  }
  if (isLayoutValidator(blockType)) {
    return new LayoutValidatorExecutor(blockType);
  }
  if (isPostgresLoader(blockType)) {
    return new PostgresLoaderExecutor(blockType);
  }
  throw new Error('Unknown block type');
}
