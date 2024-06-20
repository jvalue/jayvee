// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import process from 'node:process';

import {
  type DebugGranularity,
  DebugGranularityValues,
  type DebugTargets,
  DefaultDebugTargetsValue,
  type Logger,
  isDebugGranularity,
} from '@jvalue/jayvee-execution';
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

export interface RunOptions {
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: DebugGranularity;
  debugTarget: DebugTargets;
  parseOnly: boolean;
}

export async function runAction(
  filePath: string,
  optionsRaw: unknown,
): Promise<void> {
  const options = parseRunOptions(
    optionsRaw,
    new LoggerFactory(true).createLogger(),
  );
  if (options === undefined) {
    return process.exit(ExitCode.FAILURE);
  }

  const interpreter = new DefaultJayveeInterpreter({
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

function parseRunOptions(
  optionsRaw: unknown,
  logger: Logger,
): RunOptions | undefined {
  if (typeof optionsRaw !== 'object' || optionsRaw == null) {
    logger.logErr(
      "Error in the interpreter: didn't receive a valid RunOptions object.",
    );
    return undefined;
  }

  const requiredFields = [
    'env',
    'debug',
    'debugGranularity',
    'debugTarget',
    'parseOnly',
  ];
  if (requiredFields.some((f) => !(f in optionsRaw))) {
    logger.logErr(
      `Error in the interpreter: didn't receive a valid RunOptions object. Must have the fields ${requiredFields
        .map((f) => `"${f}"`)
        .join(', ')} but got object ${JSON.stringify(optionsRaw, null, 2)}`,
    );
    return undefined;
  }

  const options = optionsRaw as {
    env: unknown;
    debug: unknown;
    debugGranularity: unknown;
    debugTarget: unknown;
    parseOnly: unknown;
  };
  assert(
    options.env instanceof Map,
    'Error in parsing env variable (see commander setup)',
  );

  if (!isDebugGranularity(options.debugGranularity)) {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.debugGranularity,
      )}" for debug granularity option: -dg --debug-granularity.\n` +
        `Must be one of the following values: ${DebugGranularityValues.join(
          ', ',
        )}.`,
    );
    return undefined;
  }

  if (typeof options.debugTarget !== 'string') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.debugTarget,
      )}" for debug target option: -dt --debug-target.\n` +
        'Must be a string value.',
    );
    return undefined;
  }

  if (
    typeof options.debug !== 'boolean' &&
    options.debug !== 'true' &&
    options.debug !== 'false'
  ) {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.debug,
      )}" for debug option: -d --debug.\n` + 'Must be true or false.',
    );
    return undefined;
  }

  if (
    typeof options.parseOnly !== 'boolean' &&
    options.parseOnly !== 'true' &&
    options.parseOnly !== 'false'
  ) {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.parseOnly,
      )}" for parse-only option: -po --parse-only.\n` +
        'Must be true or false.',
    );
    return undefined;
  }

  if (
    !(
      options.env instanceof Map &&
      [...options.env.entries()].every(
        ([key, value]) => typeof key === 'string' && typeof value === 'string',
      )
    )
  ) {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.env,
      )}" for env option: -e --env.\n` +
        'Must be map from string keys to string values.',
    );
    return undefined;
  }

  return {
    env: options.env as Map<string, string>,
    debug: options.debug === true || options.debug === 'true',
    debugGranularity: options.debugGranularity,
    debugTarget: getDebugTargets(options.debugTarget),
    parseOnly: options.parseOnly === true || options.parseOnly === 'true',
  };
}

function getDebugTargets(debugTargetsString: string): DebugTargets {
  const areAllBlocksTargeted = debugTargetsString === DefaultDebugTargetsValue;
  if (areAllBlocksTargeted) {
    return DefaultDebugTargetsValue;
  }

  return debugTargetsString.split(',').map((target) => target.trim());
}
