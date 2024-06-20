// eslint-disable-next-line no-restricted-imports
import { strict as assert } from 'node:assert';

import {
  type DebugGranularity,
  DebugGranularityValues,
  type DebugTargets,
  DefaultConstraintExtension,
  DefaultDebugTargetsValue,
  ExecutionContext,
  type JayveeConstraintExtension,
  type JayveeExecExtension,
  type Logger,
  executeBlocks,
  isDebugGranularity,
  isErr,
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
  internalValueToString,
} from '@jvalue/jayvee-language-server';
import chalk from 'chalk';
import { NodeFileSystem } from 'langium/node';

import { LoggerFactory } from './logging';
import { ExitCode, extractAstNodeFromString } from './parsing-util';
import { validateRuntimeParameterLiteral } from './validation-checks';

export interface InterpreterOptions {
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: string;
  debugTarget: string | undefined;
}

export interface JayveeInterpreter {
  /**
   * Interprets a parsed Jayvee model.
   *
   * @param extractAstNodeFn the Jayvee model.
   * @returns the exit code indicating whether interpretation was successful or not.
   */
  interpretModel(model: JayveeModel): Promise<ExitCode>;

  /**
   * Interprets a string as a Jayvee model.
   * Parses the string first as a Jayvee model.
   *
   * @param extractAstNodeFn the Jayvee model string.
   * @returns the exit code indicating whether interpretation was successful or not.
   */
  interpretString(modelString: string): Promise<ExitCode>;

  /**
   * Parses a model without executing it.
   * Also sets up the environment so that the model can be properly executed.
   *
   * @param extractAstNodeFn method that extracts the AST node; should also initialize the workspace correctly.
   * @returns the parsed Jayvee model, or undefined on failure.
   */
  parseModel(
    extractAstNodeFn: (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) => Promise<JayveeModel>,
  ): Promise<JayveeModel | undefined>;
}

export class DefaultJayveeInterpreter implements JayveeInterpreter {
  private readonly services: JayveeServices;
  private readonly loggerFactory: LoggerFactory;

  constructor(private readonly options: InterpreterOptions) {
    this.services = createJayveeServices(NodeFileSystem).Jayvee;
    this.setupJayveeServices(this.services, this.options.env);

    this.loggerFactory = new LoggerFactory(options.debug);
  }

  async interpretModel(model: JayveeModel): Promise<ExitCode> {
    const interpretationExitCode = await this.interpretJayveeModel(
      model,
      new StdExecExtension(),
      new DefaultConstraintExtension(),
    );
    return interpretationExitCode;
  }

  async interpretString(modelString: string): Promise<ExitCode> {
    const extractAstNodeFn = async (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) =>
      await extractAstNodeFromString<JayveeModel>(
        modelString,
        services,
        loggerFactory.createLogger(),
      );

    const model = await this.parseModel(extractAstNodeFn);
    if (model === undefined) {
      return ExitCode.FAILURE;
    }

    return await this.interpretModel(model);
  }

  async parseModel(
    extractAstNodeFn: (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) => Promise<JayveeModel>,
  ): Promise<JayveeModel | undefined> {
    if (!isDebugGranularity(this.options.debugGranularity)) {
      this.loggerFactory
        .createLogger()
        .logErr(
          `Unknown value "${this.options.debugGranularity}" for debug granularity option: -dg --debug-granularity.\n` +
            `Please use one of the following values: ${DebugGranularityValues.join(
              ', ',
            )}.`,
        );
      return undefined;
    }

    try {
      const model = await extractAstNodeFn(this.services, this.loggerFactory);
      return model;
    } catch (e) {
      this.loggerFactory
        .createLogger()
        .logErr('Could not extract the AST node of the given model.');
      return undefined;
    }
  }

  private setupJayveeServices(
    services: JayveeServices,
    rawRuntimeParameters: ReadonlyMap<string, string>,
  ) {
    this.setupRuntimeParameterProvider(
      services.RuntimeParameterProvider,
      rawRuntimeParameters,
    );

    services.validation.ValidationRegistry.registerJayveeValidationChecks({
      RuntimeParameterLiteral: validateRuntimeParameterLiteral,
    });
  }

  private setupRuntimeParameterProvider(
    runtimeParameterProvider: RuntimeParameterProvider,
    rawRuntimeParameters: ReadonlyMap<string, string>,
  ) {
    runtimeParameterProvider.setValueParser(parseValueToInternalRepresentation);

    for (const [key, value] of rawRuntimeParameters.entries()) {
      runtimeParameterProvider.setValue(key, value);
    }
  }

  private async interpretJayveeModel(
    model: JayveeModel,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
  ): Promise<ExitCode> {
    const pipelineRuns: Promise<ExitCode>[] = model.pipelines.map(
      (pipeline) => {
        return this.runPipeline(
          pipeline,
          executionExtension,
          constraintExtension,
        );
      },
    );
    const exitCodes = await Promise.all(pipelineRuns);

    if (exitCodes.includes(ExitCode.FAILURE)) {
      return ExitCode.FAILURE;
    }
    return ExitCode.SUCCESS;
  }

  private async runPipeline(
    pipeline: PipelineDefinition,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
  ): Promise<ExitCode> {
    const executionContext = new ExecutionContext(
      pipeline,
      executionExtension,
      constraintExtension,
      this.loggerFactory.createLogger(),
      this.services.WrapperFactories,
      this.services.ValueTypeProvider,
      {
        isDebugMode: this.options.debug,
        debugGranularity: this.options.debugGranularity as DebugGranularity, // type of options.debugGranularity is asserted in parseModel
        debugTargets: getDebugTargets(this.options.debugTarget),
      },
      new EvaluationContext(
        this.services.RuntimeParameterProvider,
        this.services.operators.EvaluatorRegistry,
        this.services.ValueTypeProvider,
      ),
    );

    logPipelineOverview(
      pipeline,
      this.services.RuntimeParameterProvider,
      executionContext.logger,
      this.services.WrapperFactories,
    );

    const startTime = new Date();

    const executionResult = await executeBlocks(executionContext, pipeline);

    if (isErr(executionResult)) {
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

function getDebugTargets(debugTargetsString: string | undefined): DebugTargets {
  const areAllBlocksTargeted = debugTargetsString === undefined;
  if (areAllBlocksTargeted) {
    return DefaultDebugTargetsValue;
  }

  return debugTargetsString.split(',').map((target) => target.trim());
}
