// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';
import path from 'node:path';
import process from 'node:process';

import { type PipelineMeasure } from '@jvalue/jayvee-execution';
import {
  DefaultJayveeInterpreter,
  ExitCode,
  type JayveeInterpreter,
} from '@jvalue/jayvee-interpreter-lib';

function createInterpreter(): JayveeInterpreter {
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

async function runOneModel(
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

async function main() {
  const interpreter = createInterpreter();
  const measures = await runOneModel(interpreter, './example/cars.jv');

  const pipelineDurations = measures.map((measure) => measure.durationMs);
  const len = pipelineDurations.length;

  console.log('Average:', pipelineDurations.reduce((a, b) => a + b) / len);
  console.log('Max:', Math.max(...pipelineDurations));
  console.log('Min:', Math.min(...pipelineDurations));
}

await main();
