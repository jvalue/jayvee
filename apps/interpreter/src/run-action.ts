// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  LoggerFactory,
  RunOptions,
  extractAstNodeFromFile,
  interpretModel,
} from '@jvalue/jayvee-interpreter-lib';
import { JayveeModel, JayveeServices } from '@jvalue/jayvee-language-server';

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
  const exitCode = await interpretModel(extractAstNodeFn, options);
  process.exit(exitCode);
}
