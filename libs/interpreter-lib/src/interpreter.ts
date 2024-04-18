// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  type DebugGranularity,
  DefaultConstraintExtension,
  ExecutionContext,
  type JayveeConstraintExtension,
  type JayveeExecExtension,
  type Logger,
  executeBlocks,
  isDebugGranularity,
  logExecutionDuration,
  parseValueToInternalRepresentation,
} from '@jvalue/jayvee-execution';
import { StdExecExtension } from '@jvalue/jayvee-extensions/std/exec';
import {
  type BlockDefinition,
  EvaluationContext,
  type JayveeModel,
  type JayveeServices,
  type PipelineDefinition,
  type RuntimeParameterProvider,
  type WrapperFactoryProvider,
  createJayveeServices,
  initializeWorkspace,
  internalValueToString,
} from '@jvalue/jayvee-language-server';
import * as chalk from 'chalk';
import { NodeFileSystem } from 'langium/node';

import { LoggerFactory } from './logging';
import { ExitCode, extractAstNodeFromString } from './parsing-util';
import { validateRuntimeParameterLiteral } from './validation-checks';

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
  parseOnly?: boolean;
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

/**
 * Parses a model without executing it.
 * Also sets up the environment so that the model can be properly executed.
 *
 * @returns non-null model, services and loggerFactory on success.
 */
export async function parseModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
): Promise<{
  model: JayveeModel | null;
  loggerFactory: LoggerFactory;
  services: JayveeServices | null;
}> {
  let services: JayveeServices | null = null;
  let model: JayveeModel | null = null;
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
    return { model, services, loggerFactory };
  }

  services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);
  setupJayveeServices(services, options.env);

  try {
    model = await extractAstNodeFn(services, loggerFactory);
    return { model, services, loggerFactory };
  } catch (e) {
    loggerFactory
      .createLogger()
      .logErr('Could not extract the AST node of the given model.');
    return { model, services, loggerFactory };
  }
}

export async function interpretModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
): Promise<ExitCode> {
  const { model, services, loggerFactory } = await parseModel(
    extractAstNodeFn,
    options,
  );

  if (model == null || services == null) {
    return ExitCode.FAILURE;
  }

  const debugTargets = getDebugTargets(options.debugTarget);

  const interpretationExitCode = await interpretJayveeModel(
    model,
    new StdExecExtension(),
    new DefaultConstraintExtension(),
    services,
    loggerFactory,
    {
      debug: options.debug,
      // type of options.debugGranularity is asserted in parseModel
      debugGranularity: options.debugGranularity as DebugGranularity,
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

async function interpretJayveeModel(
  model: JayveeModel,
  executionExtension: JayveeExecExtension,
  constraintExtension: JayveeConstraintExtension,
  jayveeServices: JayveeServices,
  loggerFactory: LoggerFactory,
  runOptions: InterpreterOptions,
): Promise<ExitCode> {
  const pipelineRuns: Promise<ExitCode>[] = model.pipelines.map((pipeline) => {
    return runPipeline(
      pipeline,
      executionExtension,
      constraintExtension,
      jayveeServices,
      loggerFactory,
      runOptions,
    );
  });
  const exitCodes = await Promise.all(pipelineRuns);

  if (exitCodes.includes(ExitCode.FAILURE)) {
    return ExitCode.FAILURE;
  }
  return ExitCode.SUCCESS;
}

async function runPipeline(
  pipeline: PipelineDefinition,
  executionExtension: JayveeExecExtension,
  constraintExtension: JayveeConstraintExtension,
  jayveeServices: JayveeServices,
  loggerFactory: LoggerFactory,
  runOptions: InterpreterOptions,
): Promise<ExitCode> {
  const executionContext = new ExecutionContext(
    pipeline,
    executionExtension,
    constraintExtension,
    loggerFactory.createLogger(),
    jayveeServices.WrapperFactories,
    jayveeServices.ValueTypeProvider,
    {
      isDebugMode: runOptions.debug,
      debugGranularity: runOptions.debugGranularity,
      debugTargets: runOptions.debugTargets,
    },
    new EvaluationContext(
      jayveeServices.RuntimeParameterProvider,
      jayveeServices.operators.EvaluatorRegistry,
      jayveeServices.ValueTypeProvider,
    ),
  );

  logPipelineOverview(
    pipeline,
    jayveeServices.RuntimeParameterProvider,
    executionContext.logger,
    jayveeServices.WrapperFactories,
  );

  const startTime = new Date();

  const executionResult = await executeBlocks(executionContext, pipeline);

  if (R.isErr(executionResult)) {
    const diagnosticError = executionResult.left;
    executionContext.logger.logErrDiagnostic(
      diagnosticError.message,
      diagnosticError.diagnostic,
    );
    logExecutionDuration(startTime, executionContext.logger);
    return ExitCode.FAILURE;
  }

  logExecutionDuration(startTime, executionContext.logger);
  return ExitCode.SUCCESS;
}

export function logPipelineOverview(
  pipeline: PipelineDefinition,
  runtimeParameterProvider: RuntimeParameterProvider,
  logger: Logger,
  wrapperFactories: WrapperFactoryProvider,
) {
  const pipelineWrapper = wrapperFactories.Pipeline.wrap(pipeline);

  const toString = (block: BlockDefinition, depth = 0): string => {
    const blockTypeName = block.type.ref?.name;
    assert(blockTypeName !== undefined);
    const blockString = `${'\t'.repeat(depth)} -> ${
      block.name
    } (${blockTypeName})`;
    const childString = pipelineWrapper
      .getChildBlocks(block)
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
      linesBuffer.push(
        `\t\t${key}: ${internalValueToString(value, wrapperFactories)}`,
      );
    }
  }
  linesBuffer.push(
    `\tBlocks (${pipeline.blocks.length} blocks with ${pipeline.pipes.length} pipes):`,
  );
  for (const block of pipelineWrapper.getStartingBlocks()) {
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
