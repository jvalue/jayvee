// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';
import path from 'node:path';
import process from 'node:process';

import {
  DefaultJayveeInterpreter,
  ExitCode,
  type JayveeInterpreter,
  type PipelineMeasure,
} from '@jvalue/jayvee-interpreter-lib';

import { avgPipelineMeasure } from './calc';

export function createInterpreter(): JayveeInterpreter {
  const currentDir = process.cwd();
  const workingDir = currentDir;

  return new DefaultJayveeInterpreter().addWorkspace(workingDir);
}

async function runOneModelOnce(
  interpreter: JayveeInterpreter,
  modelPath: string,
): Promise<PipelineMeasure[]> {
  const logBackup = console.log;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
  const exitCode = await interpreter.interpretFile(
    path.relative(process.cwd(), modelPath),
  );
  console.log = logBackup;
  assert(exitCode === ExitCode.SUCCESS);

  const measures = interpreter.listMeasures();
  interpreter.clearMeasures();
  return measures;
}

export async function runOneModel(
  name: string,
  interpreter: JayveeInterpreter,
  modelPath: string,
  times = 10,
): Promise<PipelineMeasure[]> {
  assert(times >= 0);
  console.log(`[${name}] Running model '${modelPath}' ${times} times`);

  let measures: PipelineMeasure[] = [];
  for (let i = 0; i < times; i += 1) {
    const newMeasures = await runOneModelOnce(interpreter, modelPath);
    measures = measures.concat(newMeasures);
  }
  return measures;
}

interface BenchmarkDefinition {
  name: string;
  modelPath: string;
  expectedMeasure: PipelineMeasure;
  times?: number;
  allowedDeviationFactor: number;
}

export async function runBenchmark(
  interpreter: JayveeInterpreter,
  benchmark: BenchmarkDefinition,
): Promise<boolean> {
  const actualMeasures = await runOneModel(
    benchmark.name,
    interpreter,
    benchmark.modelPath,
    benchmark.times,
  );
  const actualMeasure = actualMeasures.reduce(avgPipelineMeasure);

  const expected = benchmark.expectedMeasure.durationMs;
  const actual = actualMeasure.durationMs;
  const deviation = actual / expected - 1;

  console.log(
    `[${benchmark.name}] Benchmark calculated an average runtime of ${actual}ms (deviation from ${expected}: ${deviation})`,
  );

  const deviates = Math.abs(deviation) > benchmark.allowedDeviationFactor;

  if (deviates) {
    console.warn(
      `[${benchmark.name}] This benchmark exceeds the maximum allowed deviation (${benchmark.allowedDeviationFactor}):`,
      '\nexpected:',
      benchmark.expectedMeasure,
      '\nactual:',
      actualMeasure,
    );
  }

  return deviates;
}
