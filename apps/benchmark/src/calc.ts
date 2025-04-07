// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import {
  type BlockMeasure,
  type PipelineMeasure,
} from '@jvalue/jayvee-interpreter-lib';

function avgWith(
  oldAverage: number,
  newValue: number,
  newSize: number,
): number {
  return oldAverage + (newValue - oldAverage) / newSize;
}

function avgBlkMeasure(b1: BlockMeasure, b2: BlockMeasure, bIdx: number) {
  assert(b1.name === b2.name);
  assert(b1.type === b2.type);
  const bRes: BlockMeasure = {
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
  p1: PipelineMeasure,
  p2: PipelineMeasure,
  pIdx: number,
): PipelineMeasure {
  assert(p1.name === p2.name);

  const blocks = p1.blocks.map((b1, bIdx) => {
    const b2 = p2.blocks[bIdx];
    assert(b2 !== undefined);
    return avgBlkMeasure(b1, b2, bIdx);
  });

  const pRes: PipelineMeasure = {
    name: p1.name,
    durationMs: avgWith(p1.durationMs, p2.durationMs, pIdx + 1),
    blocks: blocks,
  };
  return pRes;
}
