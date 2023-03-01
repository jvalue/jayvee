import { strict as assert } from 'assert';

import { ValidationAcceptor } from 'langium';

import { Attribute, Block } from '../ast/generated/ast';
import { AttributeValueType, IOType } from '../ast/model-util';

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

export abstract class BlockMetaInformation {
  docs: BlockDocs = {};

  protected constructor(
    public readonly blockType: string,
    public readonly inputType: IOType,
    public readonly outputType: IOType,
    private readonly attributes: Record<string, AttributeSpecification>,
  ) {}

  validate(block: Block, accept: ValidationAcceptor): void {
    assert(
      block.type.name === this.blockType,
      `The block to be validated is expected to be of type ${this.blockType} but is of type ${block.type.name}`,
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

  getAttributeSpecifications(): Record<string, AttributeSpecification> {
    return this.attributes;
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
    return this.inputType !== IOType.NONE;
  }

  hasOutput(): boolean {
    return this.outputType !== IOType.NONE;
  }
}
