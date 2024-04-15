// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as process from 'process';

import {
  type LoggerFactory,
  type RunOptions,
  extractAstNodeFromFile,
  interpretModel,
  parseModel,
} from '@jvalue/jayvee-interpreter-lib';
import {
  type JayveeModel,
  type JayveeServices,
} from '@jvalue/jayvee-language-server';

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
  if (options.parseOnly === true) {
    const { model, services } = await parseModel(extractAstNodeFn, options);
    const exitCode = model != null && services != null ? 0 : 1;
    process.exit(exitCode);
  }
  const exitCode = await interpretModel(extractAstNodeFn, options);
  process.exit(exitCode);
}
