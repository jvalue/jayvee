// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  IOType,
  isBlockDefinition,
  isCompositeBlocktypeDefinition,
} from '@jvalue/jayvee-language-server';

import { isBlockTargetedForDebugLogging } from '../debugging/debug-configuration';
import { DebugLogVisitor } from '../debugging/debug-log-visitor';
// eslint-disable-next-line import/no-cycle
import { ExecutionContext } from '../execution-context';
import { JayveeExecExtension } from '../extension';
import { IOTypeImplementation } from '../types/io-types/io-type-implementation';

import { BlockExecutorClass } from './block-executor-class';
// eslint-disable-next-line import/no-cycle
import {
  createCompositeBlockExecutor,
  getInputType,
  getOutputType,
} from './composite-block-executor';
import * as R from './execution-result';

export interface BlockExecutor<
  I extends IOType = IOType,
  O extends IOType = IOType,
> {
  readonly inputType: I;
  readonly outputType: O;

  execute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;
}

export abstract class AbstractBlockExecutor<I extends IOType, O extends IOType>
  implements BlockExecutor<I, O>
{
  constructor(public readonly inputType: I, public readonly outputType: O) {}

  async execute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>> {
    const executionResult = await this.doExecute(input, context);

    if (R.isOk(executionResult)) {
      this.logBlockResult(executionResult.right, context);
    }
    return executionResult;
  }

  private logBlockResult(
    result: IOTypeImplementation | null,
    context: ExecutionContext,
  ): void {
    if (!context.runOptions.isDebugMode) {
      return;
    }

    if (result == null) {
      return;
    }

    const currentNode = context.getCurrentNode();
    assert(isBlockDefinition(currentNode));
    const isBlockTargeted = isBlockTargetedForDebugLogging(
      currentNode,
      context,
    );
    if (!isBlockTargeted) {
      return;
    }

    result.acceptVisitor(
      new DebugLogVisitor(
        context.runOptions.debugGranularity,
        'Output',
        context.logger,
      ),
    );
  }

  abstract doExecute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;
}

export function createBlockExecutor(
  block: BlockDefinition,
  execExtension: JayveeExecExtension,
): BlockExecutor {
  const blockType = block.type.ref;
  assert(blockType !== undefined);

  let blockExecutor = getBlockExecutorClass(blockType.name, execExtension);

  if (
    blockExecutor === undefined &&
    isCompositeBlocktypeDefinition(block.type.ref)
  ) {
    blockExecutor = createCompositeBlockExecutor(
      getInputType(block.type.ref),
      getOutputType(block.type.ref),
      block,
    );
  }

  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType.name}`,
  );

  return new blockExecutor();
}

export function getBlockExecutorClass(
  blockTypeName: string,
  execExtension: JayveeExecExtension,
): BlockExecutorClass | undefined {
  return execExtension
    .getBlockExecutors()
    .find((x: BlockExecutorClass) => x.type === blockTypeName);
}
