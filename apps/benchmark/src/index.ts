// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { createInterpreter, runOneModel } from './runModels';

async function main() {
  const interpreter = createInterpreter();
  const measures = await runOneModel(
    interpreter,
    path.join('example', 'cars.jv'),
  );

  const pipelineDurations = measures.map((measure) => measure.durationMs);
  const len = pipelineDurations.length;

  console.log('Average:', pipelineDurations.reduce((a, b) => a + b) / len);
  console.log('Max:', Math.max(...pipelineDurations));
  console.log('Min:', Math.min(...pipelineDurations));
}

await main();
