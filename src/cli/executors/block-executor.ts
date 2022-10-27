import { BlockType } from '../../language-server/generated/ast';
import { DataType } from '../data-types';

import * as R from './execution-result';

export abstract class BlockExecutor<
  B extends BlockType,
  InType = unknown,
  OutType = unknown,
> {
  protected constructor(
    readonly block: B,
    readonly inputDataType: DataType<InType>,
    readonly outputDataType: DataType<OutType>,
  ) {}

  canExecuteAfter<T extends BlockType>(blockAfter: BlockExecutor<T>): boolean {
    return this.outputDataType === blockAfter.inputDataType;
  }

  abstract execute(input: InType): Promise<R.Result<OutType>>;
}
