import { strict as assert } from 'assert';

import { ValidationAcceptor } from 'langium';

import { Attribute, AttributeType, Block } from '../ast';
import { IOType, UNDEFINED_TYPE } from '../types/io-types/io-type';

export interface AttributeSpecification {
  type: AttributeType;
  defaultValue?: unknown;
  validation?: (attribute: Attribute, accept: ValidationAcceptor) => void;
}

export abstract class BlockMetaInformation {
  protected constructor(
    readonly blockType: string,
    private readonly inputType: IOType,
    private readonly outputType: IOType,
    private readonly attributes: Record<string, AttributeSpecification>,
  ) {}

  validate(block: Block, accept: ValidationAcceptor): void {
    assert(
      block.type === this.blockType,
      `The block to be validated is expected to be of type ${this.blockType} but is of type ${block.type}`,
    );

    for (const attribute of block.attributes) {
      const attributeSpecification = this.getAttributeSpecification(
        attribute.name,
      );
      const attributeValidationFn = attributeSpecification?.validation;
      if (attributeValidationFn === undefined) {
        continue;
      }
      attributeValidationFn(attribute, accept);
    }
  }

  getAttributeSpecification(name: string): AttributeSpecification | undefined {
    return this.attributes[name];
  }

  hasAttributeSpecification(name: string): boolean {
    return this.getAttributeSpecification(name) !== undefined;
  }

  getAttributeNames(
    kind: 'optional' | 'required' | undefined = undefined,
    excludeNames: string[] = [],
  ): string[] {
    const resultingAttributeNames: string[] = [];
    for (const [name, spec] of Object.entries(this.attributes)) {
      if (kind === 'optional' && spec.defaultValue === undefined) {
        continue;
      }
      if (kind === 'required' && spec.defaultValue !== undefined) {
        continue;
      }
      if (excludeNames.includes(name)) {
        continue;
      }
      resultingAttributeNames.push(name);
    }
    return resultingAttributeNames;
  }

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
