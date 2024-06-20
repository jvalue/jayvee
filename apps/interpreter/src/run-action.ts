// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import process from 'node:process';

import { type Logger } from '@jvalue/jayvee-execution';
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

import { parseRunOptions } from './run-options';

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

  const interpreter = new DefaultJayveeInterpreter({
    pipelineMatcher: (pipelineDefinition) =>
      pipelineRegExp.test(pipelineDefinition.name),
    env: options.env,
    debug: options.debug,
    debugGranularity: options.debugGranularity,
    debugTarget: options.debugTarget,
  });

  if (options.parseOnly === true) {
    return await runParseOnly(filePath, interpreter);
  }

  const exitCode = await interpreter.interpretFile(filePath);
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

function parsePipelineMatcherRegExp(
  matcher: string,
  logger: Logger,
): RegExp | undefined {
  try {
    return new RegExp(matcher);
  } catch (e: unknown) {
    logger.logErr(
      `Invalid value "${matcher}" for pipeline selection option: -p --pipeline.\n` +
        'Must be a valid regular expression.',
    );
    return undefined;
  }
}
