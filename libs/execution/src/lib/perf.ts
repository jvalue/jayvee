// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

export type BlockInternalLocation =
  | 'preBlockHooks'
  | 'blockExecution'
  | 'postBlockHooks';

export class MeasureLocation {
  private readonly _pipeline: string;
  private readonly _block?: {
    name: string;
    type: string;
    internalLocation?: BlockInternalLocation;
  };

  constructor(pipeline: string, block?: { name: string; type: string }) {
    this._pipeline = pipeline;
    if (block === undefined) {
      return;
    }
    this._block = block;
  }

  withBlockInternalLocation(
    blockInternalLocation: BlockInternalLocation,
  ): MeasureLocation {
    const cpy = new MeasureLocation(
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

export async function measure<R>(
  location: MeasureLocation,
  action: () => Promise<R>,
): Promise<{ result: R; durationMs: number }> {
  const name = location.name;
  const start = name + '::start';
  const end = name + '::end';

  performance.mark(start);
  const result = await action();
  performance.mark(end);

  const measure = performance.measure(name, {
    start,
    end,
    detail: location,
  });
  return { result, durationMs: measure.duration };
}

function assertMeasureLocation(obj: unknown): MeasureLocation {
  assert(obj != null);
  assert(typeof obj === 'object');
  assert('_pipeline' in obj);
  assert(typeof obj._pipeline === 'string');

  if (!('_block' in obj)) {
    return new MeasureLocation(obj._pipeline);
  }

  assert(typeof obj._block === 'object');
  assert(obj._block != null);
  assert('name' in obj._block);
  assert(typeof obj._block.name === 'string');
  assert('type' in obj._block);
  assert(typeof obj._block.type === 'string');

  const location = new MeasureLocation(obj._pipeline, {
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

export interface PipelineMeasure {
  name: string;
  durationMs: number;
  blocks: BlockMeasure[];
}

export interface BlockMeasure {
  name: string;
  type: string;
  durationMs: number;
  preBlockHooksDurationMs: number;
  blockExecutionDurationMs: number;
  postBlockHooksDurationMs: number;
}

export function listMeasures(): PipelineMeasure[] {
  const pipelines: PipelineMeasure[] = [];
  for (const entry of performance.getEntriesByType('measure')) {
    const location = assertMeasureLocation(entry.detail);
    if (location.block === undefined) {
      assert(entry.name === location.pipeline);
      pipelines.push({
        name: entry.name,
        durationMs: entry.duration,
        blocks: [],
      });
      continue;
    }

    const pipeline = pipelines.pop();
    assert(pipeline !== undefined);
    assert(location.pipeline === pipeline.name);

    if (location.block.internalLocation === undefined) {
      assert(entry.name === location.block.name);
      pipeline.blocks.push({
        name: entry.name,
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
    assert(entry.name === location.block.internalLocation);

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
