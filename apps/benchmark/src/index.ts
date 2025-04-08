// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import benchmarkDefinitions from './benchmark_definitions.json';
import { createInterpreter, runBenchmark } from './run';

async function main() {
  const interpreter = createInterpreter();
  const deviations = await Promise.all(
    benchmarkDefinitions.map((benchmark) =>
      runBenchmark(interpreter, benchmark),
    ),
  );

  process.exitCode = deviations.some((deviates) => deviates) ? 1 : 0;
}

await main();
