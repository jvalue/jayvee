// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import path from 'node:path';

import {
  type DebugGranularity,
  type DebugTargets,
  DefaultConstraintExtension,
  ExecutionContext,
  HookContext,
  type HookOptions,
  type HookPosition,
  type JayveeConstraintExtension,
  type JayveeExecExtension,
  type Logger,
  type PostBlockHook,
  type PreBlockHook,
  executeBlocks,
  isErr,
  parseValueToInternalRepresentation,
  perfMeasure,
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
import chalk from 'chalk';
import { type WorkspaceFolder } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { LoggerFactory } from './logging';
import {
  ExitCode,
  extractAstNodeFromFile,
  extractAstNodeFromString,
} from './parsing-util';
import { validateRuntimeParameterLiteral } from './validation-checks';

export interface InterpreterOptions {
  pipelineMatcher: (pipelineDefinition: PipelineDefinition) => boolean;
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: DebugGranularity;
  debugTarget: DebugTargets;
}

export class JayveeProgram {
  private _hooks = new HookContext();

  constructor(public model: JayveeModel) {}

  /** Add a hook to one or more blocks in the pipeline.*/
  public addHook(
    position: 'preBlock',
    hook: PreBlockHook,
    opts?: HookOptions,
  ): void;
  public addHook(
    position: 'postBlock',
    hook: PostBlockHook,
    opts?: HookOptions,
  ): void;
  public addHook(
    position: HookPosition,
    hook: PreBlockHook | PostBlockHook,
    opts?: HookOptions,
  ) {
    this._hooks.addHook(position, hook, opts ?? {});
  }

  public get hooks() {
    return this._hooks;
  }
}

export interface JayveeInterpreter {
  /**
   * Interprets a parsed Jayvee model.
   *
   * @param extractAstNodeFn the Jayvee model.
   * @returns the exit code indicating whether interpretation was successful or not.
   */
  interpretProgram(program: JayveeProgram): Promise<ExitCode>;

  /**
   * Interprets a file as a Jayvee model.
   * Parses the file first as a Jayvee model.
   *
   * @param filePath the file path to the Jayvee model.
   * @returns the exit code indicating whether interpretation was successful or not.
   */
  interpretFile(filePath: string): Promise<ExitCode>;

  /**
   * Interprets a string as a Jayvee model.
   * Parses the string first as a Jayvee model.
   *
   * @param modelString the Jayvee model string.
   * @returns the exit code indicating whether interpretation was successful or not.
   */
  interpretString(modelString: string): Promise<ExitCode>;

  /**
   * Parses a program without executing it.
   * Also sets up the environment so that the model can be properly executed.
   *
   * @param extractAstNodeFn method that extracts the AST node
   * @returns the parsed Jayvee program, or undefined on failure.
   */
  parseModel(
    extractAstNodeFn: (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) => Promise<JayveeModel>,
  ): Promise<JayveeProgram | undefined>;
}

export class DefaultJayveeInterpreter implements JayveeInterpreter {
  private readonly services: JayveeServices;
  private readonly loggerFactory: LoggerFactory;
  private readonly workspaces: WorkspaceFolder[] = [];
  private isWorkspaceInitialized = false;

  constructor(private readonly options: InterpreterOptions) {
    this.services = createJayveeServices(NodeFileSystem).Jayvee;
    this.setupJayveeServices(this.services, this.options.env);

    this.loggerFactory = new LoggerFactory(options.debug);
  }

  addWorkspace(uri: string): DefaultJayveeInterpreter {
    this.isWorkspaceInitialized = false;
    this.workspaces.push({
      name: 'projectRoot',
      uri: path.resolve(uri),
    });
    return this;
  }

  async interpretProgram(program: JayveeProgram): Promise<ExitCode> {
    await this.prepareInterpretation();

    const interpretationExitCode = await this.interpretJayveeProgram(
      program,
      new StdExecExtension(),
      new DefaultConstraintExtension(),
    );
    return interpretationExitCode;
  }

  async interpretFile(filePath: string): Promise<ExitCode> {
    await this.prepareInterpretation();

    const extractAstNodeFn = async (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) =>
      await extractAstNodeFromFile<JayveeModel>(
        filePath,
        services,
        loggerFactory.createLogger(),
      );

    const model = await this.parseModel(extractAstNodeFn);
    if (model === undefined) {
      return ExitCode.FAILURE;
    }

    return await this.interpretProgram(model);
  }

  async interpretString(modelString: string): Promise<ExitCode> {
    await this.prepareInterpretation();

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

    return await this.interpretProgram(model);
  }

  async parseModel(
    extractAstNodeFn: (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) => Promise<JayveeModel>,
  ): Promise<JayveeProgram | undefined> {
    await this.prepareInterpretation();

    try {
      const model = await extractAstNodeFn(this.services, this.loggerFactory);
      return new JayveeProgram(model);
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

  private async interpretJayveeProgram(
    program: JayveeProgram,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
  ): Promise<ExitCode> {
    const model = program.model;
    const selectedPipelines = model.pipelines.filter((pipeline) =>
      this.options.pipelineMatcher(pipeline),
    );
    this.loggerFactory
      .createLogger()
      .logInfo(
        `Found ${selectedPipelines.length} pipelines to execute${
          selectedPipelines.length > 0
            ? ': ' + selectedPipelines.map((p) => p.name).join(', ')
            : ''
        }`,
      );

    const pipelineRuns: Promise<ExitCode>[] = selectedPipelines.map(
      (pipeline) => {
        return this.runPipeline(
          pipeline,
          executionExtension,
          constraintExtension,
          program.hooks,
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
    hooks: HookContext,
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
        debugGranularity: this.options.debugGranularity,
        debugTargets: this.options.debugTarget,
      },
      new EvaluationContext(
        this.services.RuntimeParameterProvider,
        this.services.operators.EvaluatorRegistry,
        this.services.ValueTypeProvider,
      ),
      hooks,
    );

    logPipelineOverview(
      pipeline,
      this.services.RuntimeParameterProvider,
      executionContext.logger,
      this.services.WrapperFactories,
    );

    return perfMeasure(pipeline.name, executionContext.logger, async () => {
      const executionResult = await executeBlocks(executionContext, pipeline);

      if (isErr(executionResult)) {
        const diagnosticError = executionResult.left;
        executionContext.logger.logErrDiagnostic(
          diagnosticError.message,
          diagnosticError.diagnostic,
        );
        return ExitCode.FAILURE;
      }

      return ExitCode.SUCCESS;
    });
  }

  private async prepareInterpretation(): Promise<void> {
    if (!this.isWorkspaceInitialized) {
      await initializeWorkspace(this.services, this.workspaces);
      this.isWorkspaceInitialized = true;
    }
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
