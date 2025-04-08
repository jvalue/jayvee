// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type PipelineMeasure } from '@jvalue/jayvee-execution';

import benchmarkDefinitions from './benchmark_definitions.json';
import { createInterpreter, runBenchmark } from './run';

function measureCompare(
  actual: PipelineMeasure,
  expected: PipelineMeasure,
  allowedDeviationFactor: number,
): '=' | '<' | '>' {
  const lower = allowedDeviationFactor * expected.durationMs;
  const upper = (1 + allowedDeviationFactor) * expected.durationMs;

  if (actual.durationMs < lower) {
    return '<';
  } else if (actual.durationMs > upper) {
    return '>';
  }
  return '=';
}

async function main() {
  const interpreter = createInterpreter();
  const results = await Promise.all(
    benchmarkDefinitions.map(async (benchmark) => {
      const result = await runBenchmark(interpreter, benchmark);
      const cmp = measureCompare(
        result.actualMeasure,
        result.expectedMeasure,
        result.allowedDeviationFactor,
      );
      return { result, cmp };
    }),
  );

  const outOfBounds = results.filter(({ cmp }) => cmp !== '=');

  if (outOfBounds.length === 0) {
    console.info('No anomalies in the benchmark');
    process.exitCode = 0;
    return;
  }

  process.exitCode = 1;

  for (const { result, cmp } of outOfBounds) {
    assert(cmp !== '=', "`'='` is filtered out above");
    const msg = cmp === '<' ? 'Faster than expected:' : 'Slower than expected:';
    console.warn(msg, result);
  }
}

await main();
