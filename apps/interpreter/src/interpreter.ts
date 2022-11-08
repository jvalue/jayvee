import {
  Block,
  BlockType,
  Model,
  collectChildren,
  createJayveeServices,
  getMetaInformation,
  isCSVFileExtractor,
  isLayoutValidator,
  isPostgresLoader,
} from '@jayvee/language-server';
import { NodeFileSystem } from 'langium/node';

import { extractAstNode, printError } from './cli-util';
import { BlockExecutor } from './executors/block-executor';
import { CSVFileExtractorExecutor } from './executors/csv-file-extractor-executor';
import * as R from './executors/execution-result';
import { LayoutValidatorExecutor } from './executors/layout-validator-executor';
import { PostgresLoaderExecutor } from './executors/postgres-loader-executor';

export async function runAction(fileName: string): Promise<void> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<Model>(fileName, services);
  await interpretPipelineModel(model);
}

async function interpretPipelineModel(model: Model): Promise<void> {
  const pipelineRuns: Array<Promise<void>> = [];
  for (const block of model.blocks) {
    const blockMetaInf = getMetaInformation(block.type);
    if (!blockMetaInf.hasInput()) {
      const pipelineRun = runPipeline(block);
      pipelineRuns.push(pipelineRun);
    }
  }
  await Promise.all(pipelineRuns);
}

async function runPipeline(startingBlock: Block): Promise<void> {
  let currentBlock: Block | undefined = startingBlock;
  let blockMetaInf = getMetaInformation(currentBlock.type);
  let blockExecutor = getExecutor(currentBlock.type);
  let value: unknown = undefined;
  do {
    try {
      value = await R.dataOrThrowAsync(blockExecutor.execute(value));
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
    blockMetaInf = getMetaInformation(currentBlock.type);
    blockExecutor = getExecutor(currentBlock.type);
  } while (blockMetaInf.hasInput());
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
