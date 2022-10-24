import { BlockType } from '../../language-server/generated/ast';
import { DataType } from '../data-types';

export abstract class BlockExecutor<B extends BlockType> {
  protected constructor(
    readonly block: B,
    readonly inputDataType: DataType,
    readonly outputDataType: DataType,
  ) {}

  canExecuteAfter<T extends BlockType>(blockAfter: BlockExecutor<T>): boolean {
    return this.outputDataType === blockAfter.inputDataType;
  }

  abstract execute(input: unknown): unknown;
}
