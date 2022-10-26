import { Either } from 'fp-ts/lib/Either';
import { NodeFileSystem } from 'langium/node';

import {
  BlockType,
  Model,
  isCSVFileExtractor,
  isLayoutValidator,
  isPostgresLoader,
} from '../language-server/generated/ast';
import { createOpenDataLanguageServices } from '../language-server/open-data-language-module';

import { extractAstNode, printError } from './cli-util';
import { BlockExecutor, ExecutionError } from './executors/block-executor';
import { CSVFileExtractorExecutor } from './executors/csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './executors/layout-validator-executor';
import { PostgresLoaderExecutor } from './executors/postgres-loader-executor';

export async function runAction(fileName: string): Promise<void> {
  const services =
    createOpenDataLanguageServices(NodeFileSystem).OpenDataLanguage;
  const model = await extractAstNode<Model>(fileName, services);
  await interpretPipelineModel(model);
}

async function interpretPipelineModel(model: Model): Promise<void> {
  const csvFileExtractors = model.blocks.filter((block) =>
    isCSVFileExtractor(block.type),
  );
  if (csvFileExtractors.length !== 1) {
    throw new Error('The model requires a single extractor');
  }

  const layoutValidators = model.blocks.filter((block) =>
    isLayoutValidator(block.type),
  );
  if (layoutValidators.length !== 1) {
    throw new Error('The model requires a single layout validator');
  }

  const postgresLoaders = model.blocks.filter((block) =>
    isPostgresLoader(block.type),
  );
  if (postgresLoaders.length !== 1) {
    throw new Error('The model requires a single loader');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const csvFileExtractorExecutor = getExecutor(csvFileExtractors[0]!.type);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const layoutValidatorExecutor = getExecutor(layoutValidators[0]!.type);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const postgresLoaderExecutor = getExecutor(postgresLoaders[0]!.type);

  // Ignore pipes for now
  const executorSequence = [
    csvFileExtractorExecutor,
    layoutValidatorExecutor,
    postgresLoaderExecutor,
  ];

  checkExecutorCompatibility(executorSequence);

  await runExecutors(executorSequence);
}

function checkExecutorCompatibility(
  executorSequence: Array<BlockExecutor<BlockType>>,
): void {
  for (let index = 0; index < executorSequence.length - 1; ++index) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const executorCurrent = executorSequence[index]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const executorAfter = executorSequence[index + 1]!;

    if (!executorCurrent.canExecuteAfter(executorAfter)) {
      throw new Error(
        `Encountered incompatible block executors at indices ${index}, ${
          index + 1
        }`,
      );
    }
  }
}

async function runExecutors(
  executorSequence: Array<BlockExecutor<BlockType>>,
): Promise<void> {
  let value = undefined;
  for (const executor of executorSequence) {
    const r: Either<ExecutionError, unknown> = await executor.execute(value);
    if (r._tag === 'Left') {
      return printError(r.left);
    }
    value = r.right;
  }
}

function getExecutor(blockType: BlockType): BlockExecutor<BlockType> {
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
