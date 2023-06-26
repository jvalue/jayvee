// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DebugStringVisitor,
  ExecutionContext,
  IOTypeImplementation,
  Logger,
  NONE,
  createBlockExecutor,
  parseValueToInternalRepresentation,
  registerDefaultConstraintExecutors,
  useExtension as useExecutionExtension,
} from '@jvalue/jayvee-execution';
import * as R from '@jvalue/jayvee-execution';
import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import {
  BlockDefinition,
  EvaluationContext,
  JayveeModel,
  JayveeServices,
  PipelineDefinition,
  RuntimeParameterProvider,
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
import { validateRuntimeParameterLiteral } from './validation-checks/runtime-parameter-literal';

export async function runAction(
  fileName: string,
  options: { env: Map<string, string>; debug: boolean },
): Promise<void> {
  const loggerFactory = new LoggerFactory(options.debug);

  useStdExtension();
  registerDefaultConstraintExecutors();

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  setupJayveeServices(services, options.env);

  const model = await extractAstNode<JayveeModel>(
    fileName,
    services,
    loggerFactory.createLogger(),
  );

  const interpretationExitCode = await interpretJayveeModel(
    model,
    services.RuntimeParameterProvider,
    loggerFactory,
  );
  process.exit(interpretationExitCode);
}

function setupJayveeServices(
  services: JayveeServices,
  rawRuntimeParameters: ReadonlyMap<string, string>,
) {
  setupRuntimeParameterProvider(
    services.RuntimeParameterProvider,
    rawRuntimeParameters,
  );

  services.validation.ValidationRegistry.registerJayveeValidationChecks({
    RuntimeParameterLiteral: validateRuntimeParameterLiteral,
  });
}

function setupRuntimeParameterProvider(
  runtimeParameterProvider: RuntimeParameterProvider,
  rawRuntimeParameters: ReadonlyMap<string, string>,
) {
  runtimeParameterProvider.setValueParser(parseValueToInternalRepresentation);

  for (const [key, value] of rawRuntimeParameters.entries()) {
    runtimeParameterProvider.setValue(key, value);
  }
}

export function useStdExtension() {
  useLangExtension(new StdLangExtension());
  useExecutionExtension(new StdExecExtension());
}

async function interpretJayveeModel(
  model: JayveeModel,
  runtimeParameterProvider: RuntimeParameterProvider,
  loggerFactory: LoggerFactory,
): Promise<ExitCode> {
  const pipelineRuns: Array<Promise<ExitCode>> = model.pipelines.map(
    (pipeline) => {
      return runPipeline(pipeline, runtimeParameterProvider, loggerFactory);
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
  runtimeParameterProvider: RuntimeParameterProvider,
  loggerFactory: LoggerFactory,
): Promise<ExitCode> {
  const executionContext = new ExecutionContext(
    pipeline,
    loggerFactory.createLogger(),
    new EvaluationContext(runtimeParameterProvider),
  );

  logPipelineOverview(
    pipeline,
    runtimeParameterProvider,
    executionContext.logger,
  );

  const startTime = new Date();

  const executionOrder = getBlocksInTopologicalSorting(pipeline).map(
    (block) => {
      return { block: block, value: NONE };
    },
  );
  const exitCode = await executeBlocks(executionContext, executionOrder);

  logExecutionDuration(startTime, executionContext.logger);
  return exitCode;
}

interface ExecutionOrderItem {
  block: BlockDefinition;
  value: IOTypeImplementation | null;
}

async function executeBlocks(
  executionContext: ExecutionContext,
  executionOrder: ExecutionOrderItem[],
): Promise<ExitCode> {
  let abortExecution = false;
  for (const blockData of executionOrder) {
    const block = blockData.block;
    const parentData = collectParents(block).map((parent) =>
      executionOrder.find((blockData) => parent === blockData.block),
    );
    const inputValue =
      parentData[0]?.value === undefined ? NONE : parentData[0]?.value;

    executionContext.enterNode(block);

    const executionResult = await executeBlock(
      inputValue,
      block,
      executionContext,
    );
    if (R.isErr(executionResult)) {
      abortExecution = true;
      const diagnosticError = executionResult.left;
      executionContext.logger.logErrDiagnostic(
        diagnosticError.message,
        diagnosticError.diagnostic,
      );
    } else {
      const blockResultData = executionResult.right;
      blockData.value = blockResultData;
      console.log(blockResultData?.acceptVisitor(new DebugStringVisitor()));
    }

    executionContext.exitNode(block);

    if (abortExecution) {
      return ExitCode.FAILURE;
    }
  }
  return ExitCode.SUCCESS;
}

async function executeBlock(
  inputValue: IOTypeImplementation | null,
  block: BlockDefinition,
  executionContext: ExecutionContext,
): Promise<R.Result<IOTypeImplementation | null>> {
  if (inputValue == null) {
    executionContext.logger.logInfoDiagnostic(
      `Skipped execution because parent block emitted no value.`,
      { node: block, property: 'name' },
    );
    return R.ok(null);
  }

  const blockExecutor = createBlockExecutor(block);

  const startTime = new Date();

  let result: R.Result<IOTypeImplementation | null>;
  try {
    result = await blockExecutor.execute(inputValue, executionContext);
  } catch (unexpectedError) {
    return R.err({
      message: `An unknown error occurred: ${
        unexpectedError instanceof Error
          ? unexpectedError.stack ?? unexpectedError.message
          : JSON.stringify(unexpectedError)
      }`,
      diagnostic: { node: block, property: 'name' },
    });
  }
  logExecutionDuration(startTime, executionContext.logger);

  return result;
}

export function logExecutionDuration(startTime: Date, logger: Logger): void {
  const endTime = new Date();
  const executionDurationMs = Math.round(
    endTime.getTime() - startTime.getTime(),
  );
  logger.logDebug(`Execution duration: ${executionDurationMs} ms.`);
}

export function logPipelineOverview(
  pipeline: PipelineDefinition,
  runtimeParameterProvider: RuntimeParameterProvider,
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

  const runtimeParameters = runtimeParameterProvider.getReadonlyMap();
  if (runtimeParameters.size > 0) {
    linesBuffer.push(`\tRuntime Parameters (${runtimeParameters.size}):`);
    for (const [key, value] of runtimeParameters.entries()) {
      linesBuffer.push(`\t\t${key}: ${value.toString()}`);
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
