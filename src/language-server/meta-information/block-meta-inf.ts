import { DataType, undefinedType } from '../../interpreter/data-types';
import { BlockType } from '../generated/ast';

export abstract class BlockMetaInformation<
  B extends BlockType,
  InType = unknown,
  OutType = unknown,
> {
  protected constructor(
    readonly block: B,
    readonly inputDataType: DataType<InType>,
    readonly outputDataType: DataType<OutType>,
  ) {}

  canBeConnectedTo<T extends BlockType>(
    blockAfter: BlockMetaInformation<T>,
  ): boolean {
    return this.outputDataType === blockAfter.inputDataType;
  }

  hasInput(): boolean {
    return this.inputDataType !== undefinedType;
  }

  hasOutput(): boolean {
    return this.outputDataType !== undefinedType;
  }
}
