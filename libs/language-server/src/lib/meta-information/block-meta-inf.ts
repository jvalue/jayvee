import { BlockType } from '../generated/ast';
import { IOType, UNDEFINED_TYPE } from '../types';

export abstract class BlockMetaInformation<
  B extends BlockType,
  InType = unknown,
  OutType = unknown,
> {
  protected constructor(
    readonly block: B,
    readonly inputDataType: IOType<InType>,
    readonly outputDataType: IOType<OutType>,
  ) {}

  canBeConnectedTo<T extends BlockType>(
    blockAfter: BlockMetaInformation<T>,
  ): boolean {
    return this.outputDataType === blockAfter.inputDataType;
  }

  hasInput(): boolean {
    return this.inputDataType !== UNDEFINED_TYPE;
  }

  hasOutput(): boolean {
    return this.outputDataType !== UNDEFINED_TYPE;
  }
}
