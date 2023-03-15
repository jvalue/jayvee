import { ValidationAcceptor } from 'langium';

import { Attribute } from '../ast/generated/ast';
import { AttributeValueType, IOType } from '../ast/model-util';

import { MetaInformation } from './meta-inf';

export interface AttributeSpecification {
  type: AttributeValueType;
  defaultValue?: unknown;
  validation?: (attribute: Attribute, accept: ValidationAcceptor) => void;
  docs?: AttributeDocs;
}

export interface ExampleDoc {
  code: string;
  description: string;
}

export interface AttributeDocs {
  description?: string;
  examples?: ExampleDoc[];
  validation?: string;
}

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
