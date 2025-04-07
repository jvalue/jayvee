// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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

  const outOfBounds = results.find(({ cmp }) => cmp !== '=');

  if (outOfBounds === undefined) {
    console.info('No anomalies in the benchmark');
    process.exitCode = 0;
    return;
  }

  console.warn(outOfBounds);

  switch (outOfBounds.cmp) {
    case '<': {
      process.exitCode = 1;
      break;
    }
    case '>': {
      process.exitCode = 2;
      break;
    }
    case '=': {
      throw new Error("`cmp` cannot be `'='`");
    }
  }
}

await main();
