// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';
import process from 'node:process';

import {
  DefaultJayveeInterpreter,
  ExitCode,
  type JayveeInterpreter,
  LoggerFactory,
  extractAstNodeFromFile,
} from '@jvalue/jayvee-interpreter-lib';
import {
  type JayveeModel,
  type JayveeServices,
} from '@jvalue/jayvee-language-server';

import { parsePipelineMatcherRegExp, parseRunOptions } from './run-options';

export async function runAction(
  filePath: string,
  optionsRaw: unknown,
): Promise<void> {
  const logger = new LoggerFactory(true).createLogger('Arguments');
  const options = parseRunOptions(optionsRaw, logger);
  if (options === undefined) {
    return process.exit(ExitCode.FAILURE);
  }

  const pipelineRegExp = parsePipelineMatcherRegExp(options.pipeline, logger);
  if (pipelineRegExp === undefined) {
    return process.exit(ExitCode.FAILURE);
  }

  const currentDir = process.cwd();
  const workingDir = currentDir;
  const filePathRelativeToCurrentDir = path.relative(currentDir, filePath);

  const interpreter = new DefaultJayveeInterpreter({
    pipelineMatcher: (pipelineDefinition) =>
      pipelineRegExp.test(pipelineDefinition.name),
    env: options.env,
    debug: options.debug,
    debugGranularity: options.debugGranularity,
    debugTarget: options.debugTarget,
  }).addWorkspace(workingDir);

  if (options.graph === true) {
    return await printGraph(filePathRelativeToCurrentDir, interpreter);
  } else if (options.parseOnly === true) {
    return await runParseOnly(filePathRelativeToCurrentDir, interpreter);
  }

  const exitCode = await interpreter.interpretFile(
    filePathRelativeToCurrentDir,
  );
  process.exit(exitCode);
}

async function runParseOnly(
  filePath: string,
  interpreter: JayveeInterpreter,
): Promise<void> {
  const model = await interpreter.parseModel(
    async (services: JayveeServices, loggerFactory: LoggerFactory) =>
      await extractAstNodeFromFile<JayveeModel>(
        filePath,
        services,
        loggerFactory.createLogger(),
      ),
  );
  const exitCode = model === undefined ? ExitCode.FAILURE : ExitCode.SUCCESS;
  process.exit(exitCode);
}

async function printGraph(
  filePath: string,
  interpreter: JayveeInterpreter,
): Promise<void> {
  const program = await interpreter.parseModel(
    async (services: JayveeServices, loggerFactory: LoggerFactory) =>
      await extractAstNodeFromFile<JayveeModel>(
        filePath,
        services,
        loggerFactory.createLogger(),
      ),
  );

  if (program !== undefined) {
    const graph = interpreter.graphProgram(program);
    const log = graph === 'No pipelines to graph' ? console.warn : console.log;
    log(graph.toString());
  }

  const exitCode = program === undefined ? ExitCode.FAILURE : ExitCode.SUCCESS;
  process.exit(exitCode);
}
