// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  ExecutionContext,
  IOTypeImplementation,
  Logger,
  NONE,
  createBlockExecutor,
  isDebugGranularity,
  parseValueToInternalRepresentation,
  registerDefaultConstraintExecutors,
  useExtension as useExecutionExtension,
} from '@jvalue/jayvee-execution';
import * as R from '@jvalue/jayvee-execution';
import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import {
  BlockDefinition,
  CompositeBlocktypeDefinition,
  CompositeBlocktypeMetaInformation,
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
  getMetaInformation,
  isCompositeBlocktypeDefinition,
  metaInformationRegistry,
  useExtension as useLangExtension,
} from '@jvalue/jayvee-language-server';
import * as chalk from 'chalk';
import { NodeFileSystem } from 'langium/node';

import { LoggerFactory } from './logging/logger-factory';
import { ExitCode, extractAstNodeFromString } from './parsing-util';
import { validateRuntimeParameterLiteral } from './validation-checks/runtime-parameter-literal';

interface InterpreterOptions {
  debugGranularity: R.DebugGranularity;
  debugTargets: R.DebugTargets;
  debug: boolean;
}

export interface RunOptions {
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: string;
  debugTarget: string | undefined;
}

export async function interpretString(
  modelString: string,
  options: RunOptions,
): Promise<ExitCode> {
  const extractAstNodeFn = async (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) =>
    await extractAstNodeFromString<JayveeModel>(
      modelString,
      services,
      loggerFactory.createLogger(),
    );
  return await interpretModel(extractAstNodeFn, options);
}

function registerBlockMetaInformation(model: JayveeModel): void {
  model.blocktypes
    .filter((block) => !isCompositeBlocktypeDefinition(block))
    .filter((block) => !getMetaInformation(block))
    .forEach((block) => {
      const metaInf = new CompositeBlocktypeMetaInformation(
        block as CompositeBlocktypeDefinition,
      );
      metaInformationRegistry.register(metaInf.type, metaInf);
    });
}

export async function interpretModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
): Promise<ExitCode> {
  const loggerFactory = new LoggerFactory(options.debug);
  if (!isDebugGranularity(options.debugGranularity)) {
    loggerFactory
      .createLogger()
      .logErr(
        `Unknown value "${options.debugGranularity}" for debug granularity option: -dg --debug-granularity.\n` +
          `Please use one of the following values: ${R.DebugGranularityValues.join(
            ', ',
          )}.`,
      );
    process.exit(ExitCode.FAILURE);
  }

  useStdExtension();
  registerDefaultConstraintExecutors();

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  setupJayveeServices(services, options.env);

  const model = await extractAstNodeFn(services, loggerFactory);

  registerBlockMetaInformation(model);

  const debugTargets = getDebugTargets(options.debugTarget);

  const interpretationExitCode = await interpretJayveeModel(
    model,
    services.RuntimeParameterProvider,
    loggerFactory,
    {
      debug: options.debug,
      debugGranularity: options.debugGranularity,
      debugTargets: debugTargets,
    },
  );
  return interpretationExitCode;
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
  runOptions: InterpreterOptions,
): Promise<ExitCode> {
  const pipelineRuns: Array<Promise<ExitCode>> = model.pipelines.map(
    (pipeline) => {
      return runPipeline(
        pipeline,
        runtimeParameterProvider,
        loggerFactory,
        runOptions,
      );
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
  runOptions: InterpreterOptions,
): Promise<ExitCode> {
  const executionContext = new ExecutionContext(
    pipeline,
    loggerFactory.createLogger(),
    {
      isDebugMode: runOptions.debug,
      debugGranularity: runOptions.debugGranularity,
      debugTargets: runOptions.debugTargets,
    },
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
    const blockTypeName = block.type.ref?.name;
    assert(blockTypeName !== undefined);
    const blockString = `${'\t'.repeat(depth)} -> ${
      block.name
    } (${blockTypeName})`;
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

function getDebugTargets(
  debugTargetsString: string | undefined,
): R.DebugTargets {
  const areAllBlocksTargeted = debugTargetsString === undefined;
  if (areAllBlocksTargeted) {
    return R.DefaultDebugTargetsValue;
  }

  return debugTargetsString.split(',').map((target) => target.trim());
}
