// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { ExecutionContext } from '../execution-context';
import { IOTypeImplementation } from '../types/io-types/io-type-implementation';
import { DebugStringVisitor } from '../types/io-types/visitors/debug-string-visitor';

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

    if (R.isOk(executionResult) && context.runOptions.isDebugMode) {
      const blockResultData = executionResult.right;
      if (blockResultData != null) {
        const logMessage = blockResultData.acceptVisitor(
          new DebugStringVisitor(context.runOptions.debugGranularity),
        );

        if (logMessage !== undefined) {
          context.logger.logDebug(logMessage);
        }
      }
    }
    return executionResult;
  }

  abstract doExecute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;
}
