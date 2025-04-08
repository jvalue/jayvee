// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import {
  type BlockMeasurement,
  type PipelineMeasurement,
} from '@jvalue/jayvee-interpreter-lib';

function avgWith(
  oldAverage: number,
  newValue: number,
  newSize: number,
): number {
  return oldAverage + (newValue - oldAverage) / newSize;
}

function avgBlkMeasure(
  b1: BlockMeasurement,
  b2: BlockMeasurement,
  bIdx: number,
) {
  assert(b1.name === b2.name);
  assert(b1.type === b2.type);
  const bRes: BlockMeasurement = {
    name: b1.name,
    type: b1.type,
    durationMs: avgWith(b1.durationMs, b2.durationMs, bIdx + 1),
    preBlockHooksDurationMs: avgWith(
      b1.preBlockHooksDurationMs,
      b2.preBlockHooksDurationMs,
      bIdx + 1,
    ),
    blockExecutionDurationMs: avgWith(
      b1.blockExecutionDurationMs,
      b2.blockExecutionDurationMs,
      bIdx + 1,
    ),
    postBlockHooksDurationMs: avgWith(
      b1.postBlockHooksDurationMs,
      b2.postBlockHooksDurationMs,
      bIdx + 1,
    ),
  };
  return bRes;
}

export function avgPipelineMeasure(
  p1: PipelineMeasurement,
  p2: PipelineMeasurement,
  pIdx: number,
): PipelineMeasurement {
  assert(p1.name === p2.name);

  const blocks = p1.blocks.map((b1, bIdx) => {
    const b2 = p2.blocks[bIdx];
    assert(b2 !== undefined);
    return avgBlkMeasure(b1, b2, bIdx);
  });

  const pRes: PipelineMeasurement = {
    name: p1.name,
    durationMs: avgWith(p1.durationMs, p2.durationMs, pIdx + 1),
    blocks: blocks,
  };
  return pRes;
}
