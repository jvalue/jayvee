import {
  createBlockExecutor,
  useExtension as useExecutionExtension,
} from '@jayvee/execution';
import * as R from '@jayvee/execution';
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
import { NodeFileSystem } from 'langium/node';

import { ExitCode, extractAstNode } from './cli-util';
import { LoggerFactory } from './logging/logger-factory';
import {
  extractRequiredRuntimeParameters,
  extractRuntimeParameters,
} from './runtime-parameter-util';

export async function runAction(
  fileName: string,
  options: { env: Map<string, string>; debug: boolean },
): Promise<void> {
  const loggerFactory = new LoggerFactory(options.debug);

  useLangExtension(new StdLangExtension());
  useExecutionExtension(new StdExecExtension());

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<Model>(
    fileName,
    services,
    loggerFactory.createLogger(),
  );

  const requiredRuntimeParameters = extractRequiredRuntimeParameters(model);
  const parameterReadResult = extractRuntimeParameters(
    requiredRuntimeParameters,
    options.env,
    loggerFactory.createLogger(),
  );
  if (parameterReadResult === undefined) {
    process.exit(ExitCode.FAILURE);
  }

  const interpretationExitCode = await interpretPipelineModel(
    model,
    parameterReadResult,
    loggerFactory,
  );
  process.exit(interpretationExitCode);
}

async function interpretPipelineModel(
  model: Model,
  runtimeParameters: Map<string, string | number | boolean>,
  loggerFactory: LoggerFactory,
): Promise<ExitCode> {
  const pipelineRuns: Array<Promise<ExitCode>> = model.pipelines.map(
    (pipeline) => {
      return runPipeline(pipeline, runtimeParameters, loggerFactory);
    },
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
  loggerFactory: LoggerFactory,
): Promise<ExitCode> {
  const pipelineLogger = loggerFactory.createLogger(pipeline.name);

  printPipeline(pipeline, runtimeParameters);

  const executionOrder: Array<{ block: Block; value: unknown }> =
    getBlocksInTopologicalSorting(pipeline).map((block) => {
      return { block: block, value: undefined };
    });
  for (const blockData of executionOrder) {
    const blockLogger = loggerFactory.createLogger(blockData.block.name);
    const blockExecutor = createBlockExecutor(
      blockData.block,
      runtimeParameters,
      blockLogger,
    );
    const parentData = collectParents(blockData.block).map((parent) =>
      executionOrder.find((blockData) => parent === blockData.block),
    );
    const inputValue = parentData[0]?.value;
    let result: R.Result<unknown>;

    // Check, if parent emitted a value, but just, when it is not the root block (root blocks have no parents, so parentData holds no parents)
    if (inputValue != null || parentData.length === 0) {
      try {
        result = await blockExecutor.execute(inputValue);
      } catch (unexpectedError) {
        pipelineLogger.logErrDiagnostic(
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

      if (R.isErr(result)) {
        pipelineLogger.logErrDiagnostic(
          result.left.message,
          result.left.diagnostic,
        );
        return ExitCode.FAILURE;
      }

      blockData.value = result.right;

      // If parent emittet no value, skip all downstream blocks
    } else {
      blockData.value = null;
      pipelineLogger.logInfoDiagnostic(
        `Skipped executing block ${blockData.block.name} because parent block ${
          parentData[0] ? parentData[0].block.name : 'NAME NOT FOUND'
        } emitted no value.`,
        { node: blockData.block, property: 'name' },
      );
    }
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
      block.type.name
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
