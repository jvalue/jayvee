// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/language-server';

import { ExecutionContext } from '../execution-context';
import { IOTypeImplementation } from '../types/io-types/io-type-implementation';

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
