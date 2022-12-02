import {
  Block,
  BlockType,
  Model,
  collectChildren,
  collectStartingBlocks,
  createJayveeServices,
  getMetaInformation,
  isCSVFileExtractor,
  isLayoutValidator,
  isPostgresLoader,
  isSQLiteLoader,
} from '@jayvee/language-server';
import * as E from 'fp-ts/lib/Either';
import { assertUnreachable } from 'langium/lib/utils/errors';
import { NodeFileSystem } from 'langium/node';

import { extractAstNode, printError } from './cli-util';
import { BlockExecutor } from './executors/block-executor';
import { CSVFileExtractorExecutor } from './executors/csv-file-extractor-executor';
import * as R from './executors/execution-result';
import { LayoutValidatorExecutor } from './executors/layout-validator-executor';
import { PostgresLoaderExecutor } from './executors/postgres-loader-executor';
import { SQLiteLoaderExecutor } from './executors/sqlite-loader-executor';
import {
  extractRequiredRuntimeParameters,
  extractRuntimeParameters,
} from './runtime-parameter-util';

enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

export async function runAction(
  fileName: string,
  options: { env: Map<string, string> },
): Promise<void> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<Model>(fileName, services);

  const requiredRuntimeParameters = extractRequiredRuntimeParameters(model);
  const parameterReadResult = extractRuntimeParameters(
    requiredRuntimeParameters,
    options.env,
  );
  if (E.isLeft(parameterReadResult)) {
    parameterReadResult.left.forEach((x) => printError(x));
    process.exit(ExitCode.FAILURE);
  }

  const interpretationExitCode = await interpretPipelineModel(
    model,
    R.okData(parameterReadResult),
  );
  process.exit(interpretationExitCode);
}

async function interpretPipelineModel(
  model: Model,
  runtimeParameters: Map<string, string | number | boolean>,
): Promise<ExitCode> {
  const pipelineRuns: Array<Promise<ExitCode>> = [];
  for (const pipeline of model.pipelines) {
    const startingBlocks = collectStartingBlocks(pipeline);
    if (startingBlocks.length !== 1) {
      throw new Error(
        `Unable to find a single starting block for pipeline ${pipeline.name}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pipelineRun = runPipeline(startingBlocks[0]!, runtimeParameters);
    pipelineRuns.push(pipelineRun);
  }

  const exitCodes = await Promise.all(pipelineRuns);

  if (exitCodes.includes(ExitCode.FAILURE)) {
    return ExitCode.FAILURE;
  }
  return ExitCode.SUCCESS;
}

async function runPipeline(
  startingBlock: Block,
  runtimeParameters: Map<string, string | number | boolean>,
): Promise<ExitCode> {
  let currentBlock: Block | undefined = startingBlock;
  let blockMetaInf = getMetaInformation(currentBlock.type);
  let blockExecutor = getExecutor(currentBlock.type, runtimeParameters);
  let value: unknown = undefined;
  do {
    try {
      value = await R.dataOrThrowAsync(blockExecutor.execute(value));
    } catch (errObj) {
      if (R.isExecutionErrorDetails(errObj)) {
        printError(errObj);
        return ExitCode.FAILURE;
      }
      throw errObj;
    }

    currentBlock = collectChildren(currentBlock)[0];
    if (currentBlock === undefined) {
      return ExitCode.SUCCESS;
    }
    blockMetaInf = getMetaInformation(currentBlock.type);
    blockExecutor = getExecutor(currentBlock.type, runtimeParameters);
  } while (blockMetaInf.hasInput());

  return ExitCode.SUCCESS;
}

export function getExecutor(
  blockType: BlockType,
  runtimeParameters: Map<string, string | number | boolean>,
): BlockExecutor<BlockType> {
  if (isCSVFileExtractor(blockType)) {
    return new CSVFileExtractorExecutor(blockType, runtimeParameters);
  }
  if (isLayoutValidator(blockType)) {
    return new LayoutValidatorExecutor(blockType, runtimeParameters);
  }
  if (isPostgresLoader(blockType)) {
    return new PostgresLoaderExecutor(blockType, runtimeParameters);
  }
  if (isSQLiteLoader(blockType)) {
    return new SQLiteLoaderExecutor(blockType, runtimeParameters);
  }
  assertUnreachable(blockType);
}
