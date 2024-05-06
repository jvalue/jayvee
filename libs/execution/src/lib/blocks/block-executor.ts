// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type IOType, isBlockDefinition } from '@jvalue/jayvee-language-server';

import { isBlockTargetedForDebugLogging } from '../debugging/debug-configuration';
import { DebugLogVisitor } from '../debugging/debug-log-visitor';
import { type ExecutionContext } from '../execution-context';
import { type IOTypeImplementation } from '../types/io-types/io-type-implementation';

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
        context.wrapperFactories,
      ),
    );
  }

  abstract doExecute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;
}
