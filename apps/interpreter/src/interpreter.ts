import {
  Logger,
  createBlockExecutor,
  useExtension as useExecutionExtension,
} from '@jayvee/execution';
import { StdExecExtension } from '@jayvee/extensions/std/exec';
import { StdLangExtension } from '@jayvee/extensions/std/lang';
import {
  Block,
  Model,
  Pipeline,
  collectChildren,
  collectParents,
  collectStartingBlocks,
  createJayveeServices,
  getBlocksInTopologicalSorting,
  useExtension as useLangExtension,
} from '@jayvee/language-server';
import * as O from 'fp-ts/Option';
import { NodeFileSystem } from 'langium/node';

import { ExitCode, extractAstNode } from './cli-util';
import { DefaultLogger } from './default-logger';
import {
  extractRequiredRuntimeParameters,
  extractRuntimeParameters,
} from './runtime-parameter-util';

export async function runAction(
  fileName: string,
  options: { env: Map<string, string>; debug: boolean },
): Promise<void> {
  const logger = new DefaultLogger(options.debug);

  useLangExtension(new StdLangExtension());
  useExecutionExtension(new StdExecExtension());

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<Model>(fileName, services, logger);

  const requiredRuntimeParameters = extractRequiredRuntimeParameters(model);
  const parameterReadResult = extractRuntimeParameters(
    requiredRuntimeParameters,
    options.env,
    logger,
  );
  if (O.isNone(parameterReadResult)) {
    process.exit(ExitCode.FAILURE);
  }

  const interpretationExitCode = await interpretPipelineModel(
    model,
    parameterReadResult.value,
    logger,
  );
  process.exit(interpretationExitCode);
}

async function interpretPipelineModel(
  model: Model,
  runtimeParameters: Map<string, string | number | boolean>,
  logger: Logger,
): Promise<ExitCode> {
  console.info('Interpreting pipeline model');
  const pipelineRuns: Array<Promise<ExitCode>> = model.pipelines.map(
    (pipeline) => runPipeline(pipeline, runtimeParameters, logger),
  );
  const exitCodes = await Promise.all(pipelineRuns);

  if (exitCodes.includes(ExitCode.FAILURE)) {
    return ExitCode.FAILURE;
  }
  return ExitCode.SUCCESS;
}

async function runPipeline(
  pipeline: Pipeline,
  runtimeParameters: Map<string, string | number | boolean>,
  logger: Logger,
): Promise<ExitCode> {
  printPipeline(pipeline, runtimeParameters);

  const executionOrder: Array<{ block: Block; value: unknown }> =
    getBlocksInTopologicalSorting(pipeline).map((block) => {
      return { block: block, value: undefined };
    });

  for (const blockData of executionOrder) {
    const blockExecutor = createBlockExecutor(
      blockData.block,
      runtimeParameters,
      logger,
    );
    const parentData = collectParents(blockData.block).map((parent) =>
      executionOrder.find((blockData) => parent === blockData.block),
    );

    const inputValue = parentData[0]?.value;

    let result: O.Option<unknown>;
    try {
      result = await blockExecutor.execute(inputValue);
    } catch (unexpectedError) {
      logger.log(
        'error',
        `An unknown error occurred during the execution of block ${
          blockData.block.name
        }: ${
          unexpectedError instanceof Error
            ? unexpectedError.message
            : JSON.stringify(unexpectedError)
        }`,
        { node: blockData.block, property: 'name' },
      );
      return ExitCode.FAILURE;
    }

    if (O.isNone(result)) {
      logger.log(
        'error',
        `The execution of block ${blockData.block.name} was not successful. Aborting execution.`,
      );
      return ExitCode.FAILURE;
    }

    blockData.value = result.value;
  }

  return ExitCode.SUCCESS;
}

export function printPipeline(
  pipeline: Pipeline,
  runtimeParameters: Map<string, string | number | boolean>,
  printCallback: (output: string) => void = console.info,
) {
  const toString = (block: Block, depth = 0): string => {
    const blockString = `${'\t'.repeat(depth)} -> ${block.name} (${
      block.type
    })`;
    const childString = collectChildren(block)
      .map((child) => toString(child, depth + 1))
      .join('\n');
    return blockString + '\n' + childString;
  };

  printCallback(`Pipeline ${pipeline.name}:`);
  printCallback(`\tRuntime Parameters (${runtimeParameters.size}):`);
  for (const key of runtimeParameters.keys()) {
    console.log(
      `\t ${key}: ${
        runtimeParameters.has(key)
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            runtimeParameters.get(key)!.toString()
          : 'undefined'
      }`,
    );
  }
  printCallback(
    `\tBlocks (${pipeline.blocks.length} blocks with ${pipeline.pipes.length} pipes):`,
  );
  for (const block of collectStartingBlocks(pipeline)) {
    printCallback(toString(block, 1));
  }
}
