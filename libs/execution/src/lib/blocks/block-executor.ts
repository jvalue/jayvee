import { IOType } from '@jvalue/language-server';

import { ExecutionContext } from '../execution-context';
import { IOTypeImplementation } from '../types/io-types/io-type-implementation';

import * as R from './execution-result';

export interface BlockExecutor<
  I extends IOType = IOType,
  O extends IOType = IOType,
> {
  readonly blockType: string;
  readonly inputType: I;
  readonly outputType: O;

  execute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;
}
