import * as E from 'fp-ts/lib/Either';
import { CstNode } from 'langium';

import { BlockType } from '../../language-server/generated/ast';
import { DataType } from '../data-types';

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

  abstract execute(input: InType): Promise<E.Either<ExecutionError, OutType>>;
}

export interface ExecutionError {
  message: string;
  hint?: string;
  cstNode?: CstNode | undefined;
}
