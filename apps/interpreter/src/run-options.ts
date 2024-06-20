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
    'env',
    'debug',
    'debugGranularity',
    'debugTarget',
    'parseOnly',
    'pipeline',
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
    pipeline: unknown;
    env: unknown;
    debug: unknown;
    debugGranularity: unknown;
    debugTarget: unknown;
    parseOnly: unknown;
  };

  // options.pipeline
  if (typeof options.pipeline !== 'string') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.pipeline,
      )}" for pipeline selection option: -p --pipeline.\n` +
        'Must be a string value.',
    );
    return undefined;
  }

  // options.debugGranularity
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

  // options.debugTarget
  if (typeof options.debugTarget !== 'string') {
    logger.logErr(
      `Invalid value "${JSON.stringify(
        options.debugTarget,
      )}" for debug target option: -dt --debug-target.\n` +
        'Must be a string value.',
    );
    return undefined;
  }

  // options.debug
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

  // options.parseOnly
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

  // options.env
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
    pipeline: options.pipeline,
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
