import { BlockType } from '../ast/generated/ast';
import { IOType, UNDEFINED_TYPE } from '../types/io-types';

export enum AttributeType {
  STRING = 'string',
  INT = 'integer',
  LAYOUT = 'layout',
}

export interface AttributeSpecification {
  type: AttributeType;
  defaultValue?: unknown;
}

export abstract class BlockMetaInformation {
  protected constructor(
    readonly blockType: BlockType,
    readonly inputType: IOType,
    readonly outputType: IOType,
    readonly attributes: Record<string, AttributeSpecification>,
  ) {}

  canBeConnectedTo(blockAfter: BlockMetaInformation): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== UNDEFINED_TYPE;
  }

  hasOutput(): boolean {
    return this.outputType !== UNDEFINED_TYPE;
  }
}
