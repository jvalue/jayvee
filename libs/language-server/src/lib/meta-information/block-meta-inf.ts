import { IOType } from '../ast/model-util';

import {
  AttributeSpecification,
  ExampleDoc,
  MetaInformation,
} from './meta-inf';

interface BlockDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export abstract class BlockMetaInformation extends MetaInformation {
  docs: BlockDocs = {};

  protected constructor(
    blockType: string,
    attributes: Record<string, AttributeSpecification>,
    public readonly inputType: IOType,
    public readonly outputType: IOType,
  ) {
    super(blockType, attributes);
  }

  canBeConnectedTo(blockAfter: BlockMetaInformation): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== IOType.NONE;
  }

  hasOutput(): boolean {
    return this.outputType !== IOType.NONE;
  }
}
