// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import process from 'node:process';

import {
  DefaultJayveeInterpreter,
  ExitCode,
  type LoggerFactory,
  extractAstNodeFromFile,
} from '@jvalue/jayvee-interpreter-lib';
import {
  type JayveeModel,
  type JayveeServices,
} from '@jvalue/jayvee-language-server';

export interface RunOptions {
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: string;
  debugTarget: string | undefined;
  parseOnly?: boolean;
}

export async function runAction(
  fileName: string,
  options: RunOptions,
): Promise<void> {
  const extractAstNodeFn = async (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) =>
    await extractAstNodeFromFile<JayveeModel>(
      fileName,
      services,
      loggerFactory.createLogger(),
    );

  const interpreter = new DefaultJayveeInterpreter({
    env: options.env,
    debug: options.debug,
    debugGranularity: options.debugGranularity,
    debugTarget: options.debugTarget,
  });

  const model = await interpreter.parseModel(extractAstNodeFn);
  if (model === undefined) {
    process.exit(ExitCode.FAILURE);
  }

  if (options.parseOnly === true) {
    process.exit(ExitCode.SUCCESS);
  }

  const exitCode = await interpreter.interpretModel(model);
  process.exit(exitCode);
}
