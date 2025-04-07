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
  interpreter: JayveeInterpreter,
  modelPath: string,
  times = 10,
): Promise<PipelineMeasure[]> {
  assert(times >= 0);
  let measures: PipelineMeasure[] = [];
  for (let i = 0; i < times; i += 1) {
    const newMeasures = await runOneModelOnce(interpreter, modelPath);
    measures = measures.concat(newMeasures);
  }
  return measures;
}

interface BenchmarkDefinition {
  modelPath: string;
  expectedMeasure: PipelineMeasure;
  times?: number;
  allowedDeviationFactor: number;
}

interface BenchmarkResult extends BenchmarkDefinition {
  actualMeasure: PipelineMeasure;
}

export async function runBenchmark(
  interpreter: JayveeInterpreter,
  benchmark: BenchmarkDefinition,
): Promise<BenchmarkResult> {
  const actualMeasures = await runOneModel(
    interpreter,
    benchmark.modelPath,
    benchmark.times,
  );

  return {
    actualMeasure: actualMeasures.reduce(avgPipelineMeasure),
    ...benchmark,
  };
}
