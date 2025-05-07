// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import path from 'node:path';

import {
  ClassAssignment,
  type DebugGranularity,
  type DebugTargets,
  DefaultConstraintExtension,
  DefaultDebugTargetsValue,
  ExecutionContext,
  Graph,
  HookContext,
  type HookOptions,
  type HookPosition,
  type JayveeConstraintExtension,
  type JayveeExecExtension,
  type Logger,
  MeasurementLocation,
  type PipelineMeasurement,
  type PostBlockHook,
  type PreBlockHook,
  executeBlocks,
  executionGraph,
  isErr,
  listMeasurements,
  measure,
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

export {
  type PipelineMeasurement,
  type BlockMeasurement,
} from '@jvalue/jayvee-execution';

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
   * Graphs a parsed jayvee program.
   *
   * @param program The Jayvee program.
   * @returns An object that can be printed to the console. The output follows `mermaid.js` syntax
   */
  graphProgram(program: JayveeProgram): Graph | 'No pipelines to graph';

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

  /**
   * List all measurements made until this point. Should only be called after
   * interpreting a model.
   *
   * @returns a list of pipeline durations
   * {@link PipelineMeasure}
   */
  listMeasurements(): PipelineMeasurement[];

  /**
   * Clear all existing measurements.
   */
  clearMeasurements(): void;
}

export const DefaultInterpreterOptions: InterpreterOptions = {
  pipelineMatcher: (pipelineDefinition) =>
    new RegExp('.*').test(pipelineDefinition.name),
  env: new Map<string, string>(),
  debug: false,
  debugGranularity: 'minimal',
  debugTarget: DefaultDebugTargetsValue,
};

export class DefaultJayveeInterpreter implements JayveeInterpreter {
  private readonly services: JayveeServices;
  private readonly loggerFactory: LoggerFactory;
  private readonly workspaces: WorkspaceFolder[] = [];
  private readonly options: InterpreterOptions;
  private isWorkspaceInitialized = false;

  constructor(options?: Partial<InterpreterOptions>) {
    this.options = { ...DefaultInterpreterOptions, ...options };
    this.services = createJayveeServices(NodeFileSystem).Jayvee;
    this.setupJayveeServices(this.services, this.options.env);

    this.loggerFactory = new LoggerFactory(this.options.debug);
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

  graphProgram(program: JayveeProgram): Graph | 'No pipelines to graph' {
    return this.graphJayveeModel(
      program,
      new StdExecExtension(),
      new DefaultConstraintExtension(),
    );
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

  listMeasurements(): PipelineMeasurement[] {
    return listMeasurements();
  }

  clearMeasurements() {
    performance.clearMarks();
    performance.clearMeasures();
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

  private graphJayveeModel(
    program: JayveeProgram,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
  ): Graph | 'No pipelines to graph' {
    const model = program.model;
    const selectedPipelines = model.pipelines.filter((pipeline) =>
      this.options.pipelineMatcher(pipeline),
    );
    const logger = this.loggerFactory.createLogger();
    logger.logInfo(
      `Found ${selectedPipelines.length} pipelines to graph${
        selectedPipelines.length > 0
          ? ': ' + selectedPipelines.map((p) => p.name).join(', ')
          : ''
      }`,
    );

    if (selectedPipelines.length === 0) {
      return 'No pipelines to graph';
    }

    if (selectedPipelines.length === 1) {
      const [pipeline, ...rest] = selectedPipelines;
      assert(pipeline !== undefined);
      assert(rest.length === 0);

      return this.graphPipeline(
        pipeline,
        executionExtension,
        constraintExtension,
        program.hooks,
      );
    }

    const name =
      program.model.$document !== undefined &&
      program.model.$document.uri.path !== ''
        ? path.basename(program.model.$document.uri.path)
        : undefined;
    const graph = new Graph(name);

    for (const pipeline of selectedPipelines) {
      const subgraph = this.graphPipeline(
        pipeline,
        executionExtension,
        constraintExtension,
        program.hooks,
      );
      graph.addSubgraph(subgraph);
      graph.addClassAssignment(new ClassAssignment(subgraph.id, 'pipeline'));
      if (subgraph.title !== undefined)
        graph.addClassAssignment(new ClassAssignment(subgraph.id, 'pipeline'));
    }

    return graph;
  }

  private defaultExecutionContext(
    pipeline: PipelineDefinition,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
    hooks: HookContext,
  ): ExecutionContext {
    return new ExecutionContext(
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
  }

  private async runPipeline(
    pipeline: PipelineDefinition,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
    hooks: HookContext,
  ): Promise<ExitCode> {
    const executionContext = this.defaultExecutionContext(
      pipeline,
      executionExtension,
      constraintExtension,
      hooks,
    );

    logPipelineOverview(
      pipeline,
      this.services.RuntimeParameterProvider,
      executionContext.logger,
      this.services.WrapperFactories,
    );

    const { result, durationMs } = await measure(async () => {
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
    }, new MeasurementLocation(pipeline.name));
    executionContext.logger.logDebug(
      `${pipeline.name} took ${Math.round(durationMs)} ms`,
    );
    return result;
  }

  private graphPipeline(
    pipeline: PipelineDefinition,
    executionExtension: JayveeExecExtension,
    constraintExtension: JayveeConstraintExtension,
    hooks: HookContext,
  ): Graph {
    const executionContext = this.defaultExecutionContext(
      pipeline,
      executionExtension,
      constraintExtension,
      hooks,
    );

    return executionGraph(executionContext, pipeline);
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
