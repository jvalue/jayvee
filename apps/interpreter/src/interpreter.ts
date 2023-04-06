// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ExecutionContext,
  IOTypeImplementation,
  Logger,
  NONE,
  createBlockExecutor,
  registerDefaultConstraintExecutors,
  useExtension as useExecutionExtension,
} from '@jvalue/jayvee-execution';
import * as R from '@jvalue/jayvee-execution';
import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import {
  BlockDefinition,
  JayveeModel,
  PipelineDefinition,
  collectChildren,
  collectParents,
  collectStartingBlocks,
  createJayveeServices,
  getBlocksInTopologicalSorting,
  useExtension as useLangExtension,
} from '@jvalue/jayvee-language-server';
import * as chalk from 'chalk';
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

  useStdExtension();
  registerDefaultConstraintExecutors();

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<JayveeModel>(
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

  const interpretationExitCode = await interpretJayveeModel(
    model,
    parameterReadResult,
    loggerFactory,
  );
  process.exit(interpretationExitCode);
}

export function useStdExtension() {
  useLangExtension(new StdLangExtension());
  useExecutionExtension(new StdExecExtension());
}

async function interpretJayveeModel(
  model: JayveeModel,
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
  pipeline: PipelineDefinition,
  runtimeParameters: Map<string, string | number | boolean>,
  loggerFactory: LoggerFactory,
): Promise<ExitCode> {
  const executionContext = new ExecutionContext(
    pipeline,
    loggerFactory.createLogger(),
    runtimeParameters,
  );

  logPipelineOverview(pipeline, runtimeParameters, executionContext.logger);

  const startTime = new Date();

  const executionOrder = getBlocksInTopologicalSorting(pipeline).map(
    (block) => {
      return { block: block, value: NONE };
    },
  );
  const exitCode = await executeBlocks(executionContext, executionOrder);

  const endTime = new Date();
  const executionDurationMs = Math.round(
    endTime.getTime() - startTime.getTime(),
  );
  executionContext.logger.logDebug(
    `Execution duration: ${executionDurationMs} ms.`,
  );

  return exitCode;
}

type ExecutionOrderList = Array<{
  block: BlockDefinition;
  value: IOTypeImplementation | null;
}>;

async function executeBlocks(
  executionContext: ExecutionContext,
  executionOrder: ExecutionOrderList,
): Promise<ExitCode> {
  for (const blockData of executionOrder) {
    const block = blockData.block;
    executionContext.enterNode(block);

    const blockExecutor = createBlockExecutor(block);
    const parentData = collectParents(block).map((parent) =>
      executionOrder.find((blockData) => parent === blockData.block),
    );
    const inputValue =
      parentData[0]?.value === undefined ? NONE : parentData[0]?.value;

    let result: R.Result<IOTypeImplementation | null>;

    // Check, if parent emitted a value
    if (inputValue != null) {
      try {
        result = await blockExecutor.execute(inputValue, executionContext);
      } catch (unexpectedError) {
        executionContext.logger.logErrDiagnostic(
          `An unknown error occurred: ${
            unexpectedError instanceof Error
              ? unexpectedError.message
              : JSON.stringify(unexpectedError)
          }`,
          { node: blockData.block, property: 'name' },
        );
        return ExitCode.FAILURE;
      }

      if (R.isErr(result)) {
        executionContext.logger.logErrDiagnostic(
          result.left.message,
          result.left.diagnostic,
        );
        return ExitCode.FAILURE;
      }

      blockData.value = result.right;

      // If parent emitted no value, skip all downstream blocks
    } else {
      blockData.value = null;
      executionContext.logger.logInfoDiagnostic(
        `Skipped execution because parent block ${
          parentData[0] ? parentData[0].block.name : 'NAME NOT FOUND'
        } emitted no value.`,
        { node: blockData.block, property: 'name' },
      );
    }
    executionContext.exitNode(block);
  }
  return ExitCode.SUCCESS;
}

export function logPipelineOverview(
  pipeline: PipelineDefinition,
  runtimeParameters: Map<string, string | number | boolean>,
  logger: Logger,
) {
  const toString = (block: BlockDefinition, depth = 0): string => {
    const blockString = `${'\t'.repeat(depth)} -> ${block.name} (${
      block.type.name
    })`;
    const childString = collectChildren(block)
      .map((child) => toString(child, depth + 1))
      .join('\n');
    return blockString + '\n' + childString;
  };

  const linesBuffer: string[] = [];

  linesBuffer.push(chalk.underline('Overview:'));

  if (runtimeParameters.size > 0) {
    linesBuffer.push(`\tRuntime Parameters (${runtimeParameters.size}):`);
    for (const key of runtimeParameters.keys()) {
      linesBuffer.push(
        `\t\t${key}: ${
          runtimeParameters.has(key)
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              runtimeParameters.get(key)!.toString()
            : 'undefined'
        }`,
      );
    }
  }
  linesBuffer.push(
    `\tBlocks (${pipeline.blocks.length} blocks with ${pipeline.pipes.length} pipes):`,
  );
  for (const block of collectStartingBlocks(pipeline)) {
    linesBuffer.push(toString(block, 1));
  }
  logger.logInfo(linesBuffer.join('\n'));
}
