// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type DebugGranularity,
  DebugGranularityValues,
  type DebugTargets,
  DefaultDebugTargetsValue,
  type Logger,
  isDebugGranularity,
} from '@jvalue/jayvee-execution';

export interface RunOptions {
  pipeline: string;
  env: Map<string, string>;
  debug: boolean;
  debugGranularity: DebugGranularity;
  debugTarget: DebugTargets;
  parseOnly: boolean;
}

export function parseRunOptions(
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
    'pipeline',
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

  const options = optionsRaw as Record<keyof RunOptions, unknown>;

  if (
    !isPipelineArgument(options.pipeline, logger) ||
    !isEnvArgument(options.env, logger) ||
    !isDebugArgument(options.debug, logger) ||
    !isDebugGranularityArgument(options.debugGranularity, logger) ||
    !isDebugTargetArgument(options.debugTarget, logger) ||
    !isParseOnlyArgument(options.parseOnly, logger)
  ) {
    return undefined;
  }

  return {
    pipeline: options.pipeline,
    env: options.env,
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

function isPipelineArgument(arg: unknown, logger: Logger): arg is string {
  if (typeof arg !== 'string') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        arg,
      )}" for pipeline selection option: -p --pipeline.\n` +
        'Must be a string value.',
    );
    return false;
  }
  return true;
}

function isDebugGranularityArgument(
  arg: unknown,
  logger: Logger,
): arg is DebugGranularity {
  if (!isDebugGranularity(arg)) {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        arg,
      )}" for debug granularity option: -dg --debug-granularity.\n` +
        `Must be one of the following values: ${DebugGranularityValues.join(
          ', ',
        )}.`,
    );
    return false;
  }
  return true;
}

function isDebugTargetArgument(arg: unknown, logger: Logger): arg is string {
  // options.debugTarget
  if (typeof arg !== 'string') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        arg,
      )}" for debug target option: -dt --debug-target.\n` +
        'Must be a string value.',
    );
    return false;
  }
  return true;
}

function isDebugArgument(
  arg: unknown,
  logger: Logger,
): arg is boolean | 'true' | 'false' {
  if (typeof arg !== 'boolean' && arg !== 'true' && arg !== 'false') {
    logger.logErr(
      `Invalid value "${JSON.stringify(arg)}" for debug option: -d --debug.\n` +
        'Must be true or false.',
    );
    return false;
  }
  return true;
}

function isParseOnlyArgument(
  arg: unknown,
  logger: Logger,
): arg is boolean | 'true' | 'false' {
  if (typeof arg !== 'boolean' && arg !== 'true' && arg !== 'false') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        arg,
      )}" for parse-only option: -po --parse-only.\n` +
        'Must be true or false.',
    );
    return false;
  }
  return true;
}

function isEnvArgument(
  arg: unknown,
  logger: Logger,
): arg is Map<string, string> {
  if (
    !(
      arg instanceof Map &&
      [...arg.entries()].every(
        ([key, value]) => typeof key === 'string' && typeof value === 'string',
      )
    )
  ) {
    logger.logErr(
      `Invalid value "${JSON.stringify(arg)}" for env option: -e --env.\n` +
        'Must be map from string keys to string values.',
    );
    return false;
  }
  return true;
}

export function parsePipelineMatcherRegExp(
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
