// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

export type BlockInternalLocation =
  | 'preBlockHooks'
  | 'blockExecution'
  | 'postBlockHooks';

/**
 * The location/type of a measurement. Can be one of:
 * - pipeline
 * - block
 * - block-internal {@link BlockInternalLocation}
 */
export class MeasurementLocation {
  private readonly _pipeline: string;
  private readonly _block?: {
    name: string;
    type: string;
    internalLocation?: BlockInternalLocation;
  };

  /**
   * Creates a new measurement location. If the measurement's location is block-internal, use `withBlockInternalLocation()`.
   * @param pipeline The name of the pipeline the measurement is in.
   * @param block If the measurement is inside a block, this parameter specifies name and type.
   * @returns A measurement location
   */
  constructor(pipeline: string, block?: { name: string; type: string }) {
    this._pipeline = pipeline;
    if (block === undefined) {
      return;
    }
    this._block = block;
  }

  withBlockInternalLocation(
    blockInternalLocation: BlockInternalLocation,
  ): MeasurementLocation {
    const cpy = new MeasurementLocation(
      this._pipeline,
      structuredClone(this._block),
    );
    assert(cpy._block !== undefined);
    cpy._block.internalLocation = blockInternalLocation;
    return cpy;
  }

  get pipeline(): string {
    return this._pipeline;
  }

  get block():
    | {
        name: string;
        type: string;
        internalLocation?: BlockInternalLocation;
      }
    | undefined {
    return this._block;
  }

  get id(): string {
    let id = this._pipeline;
    if (this._block !== undefined) {
      id += `::${this._block.name}`;
      if (this._block.internalLocation !== undefined) {
        id += `::${this._block.internalLocation}`;
      }
    }
    return id;
  }

  get name(): string {
    if (this._block === undefined) {
      return this._pipeline;
    }
    if (this._block.internalLocation === undefined) {
      return this._block.name;
    }
    return this._block.internalLocation;
  }
}

/**
 * Measure the duration of any action.
 * @param id The action's name/identifier
 * @param action The action to measure
 * @returns The action's result and the actions duration in milliseconds
 */
export async function measure<R>(
  action: () => Promise<R>,
  id: string,
  detail?: unknown,
): Promise<{ result: R; durationMs: number }>;
/**
 * Measure the duration of a pipeline, block or block-internal.
 * @param location The measurement's location
 * @param action The action to measure
 * @returns The action's result and the actions duration in milliseconds
 */
export async function measure<R>(
  action: () => Promise<R>,
  location: MeasurementLocation,
): Promise<{ result: R; durationMs: number }>;
export async function measure<R>(
  action: () => Promise<R>,
  location: MeasurementLocation | string,
  detail?: unknown,
): Promise<{ result: R; durationMs: number }> {
  const id = typeof location === 'string' ? location : location.id;
  if (typeof location !== 'string') {
    assert(detail === undefined);
    detail = location;
  }
  const start = id + '::start';
  const end = id + '::end';

  performance.mark(start);
  const result = await action();
  performance.mark(end);

  const measurement = performance.measure(id, {
    start,
    end,
    detail,
  });
  return { result, durationMs: measurement.duration };
}

function assertMeasurementLocation(obj: unknown): MeasurementLocation {
  assert(obj != null);
  assert(typeof obj === 'object');
  assert('_pipeline' in obj);
  assert(typeof obj._pipeline === 'string');

  if (!('_block' in obj)) {
    return new MeasurementLocation(obj._pipeline);
  }

  assert(typeof obj._block === 'object');
  assert(obj._block != null);
  assert('name' in obj._block);
  assert(typeof obj._block.name === 'string');
  assert('type' in obj._block);
  assert(typeof obj._block.type === 'string');

  const location = new MeasurementLocation(obj._pipeline, {
    name: obj._block.name,
    type: obj._block.type,
  });

  if (!('internalLocation' in obj._block)) {
    return location;
  }
  assert(typeof obj._block.internalLocation === 'string');
  assert(
    obj._block.internalLocation === 'preBlockHooks' ||
      obj._block.internalLocation === 'blockExecution' ||
      obj._block.internalLocation === 'postBlockHooks',
  );
  return location.withBlockInternalLocation(obj._block.internalLocation);
}

/**
 * The measured duration of a pipeline. Includes a list of block measurements.
 */
export interface PipelineMeasurement {
  /**
   * The pipeline's name.
   */
  name: string;
  /**
   * The pipeline's duration in milliseconds
   */
  durationMs: number;
  /**
   * The measurements of blocks executed as part of the pipeline.
   * {@link BlockMeasurement}
   */
  blocks: BlockMeasurement[];
}

/**
 * The measured duration of a block. Also includes the duration of the pre- and
 * post-block hooks.
 */
export interface BlockMeasurement {
  /**
   * The block's name.
   */
  name: string;
  /**
   * The block's block type (e.g. 'TableInterpreter').
   */
  type: string;
  /**
   * The block's total duration in milliseconds.
   */
  durationMs: number;
  /**
   * The duration of the pre-block hooks in milliseconds.
   */
  preBlockHooksDurationMs: number;
  /**
   * The duration of the block execution method itself in milliseconds.
   */
  blockExecutionDurationMs: number;
  /**
   * The duration of the post-block hooks in milliseconds.
   */
  postBlockHooksDurationMs: number;
}

/**
 * List all measurements made until this point. Should only be called after
 * interpreting a model.
 *
 * @returns a list of pipeline durations
 * {@link PipelineMeasurement}
 */
export function listMeasurements(): PipelineMeasurement[] {
  const pipelines: PipelineMeasurement[] = [];
  for (const entry of performance.getEntriesByType('measure')) {
    const location = assertMeasurementLocation(entry.detail);
    assert(entry.name === location.id);
    if (location.block === undefined) {
      assert(entry.name === location.pipeline);
      pipelines.push({
        name: location.pipeline,
        durationMs: entry.duration,
        blocks: [],
      });
      continue;
    }

    const pipeline = pipelines.pop();
    assert(pipeline !== undefined);
    assert(location.pipeline === pipeline.name);

    if (location.block.internalLocation === undefined) {
      assert(entry.name.endsWith(location.block.name));
      pipeline.blocks.push({
        name: location.block.name,
        type: location.block.type,
        durationMs: entry.duration,
        preBlockHooksDurationMs: 0,
        blockExecutionDurationMs: 0,
        postBlockHooksDurationMs: 0,
      });
      pipelines.push(pipeline);
      continue;
    }

    const block = pipeline.blocks.pop();
    assert(block !== undefined);
    assert(location.block.name === block.name);
    assert(entry.name.endsWith(location.block.internalLocation));

    switch (location.block.internalLocation) {
      case 'preBlockHooks':
        block.preBlockHooksDurationMs = entry.duration;
        break;
      case 'blockExecution':
        block.blockExecutionDurationMs = entry.duration;
        break;
      case 'postBlockHooks':
        block.postBlockHooksDurationMs = entry.duration;
        break;
    }
    pipeline.blocks.push(block);
    pipelines.push(pipeline);
  }

  return pipelines;
}
