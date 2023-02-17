import { strict as assert } from 'assert';

import { ValidationAcceptor } from 'langium';

import { Attribute, Block } from '../ast/generated/ast';
import { AttributeType, IOType } from '../ast/model-util';

import { MarkdownDocBuilder } from './markdown-doc-builder';

export interface AttributeSpecification {
  type: AttributeType;
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
    return this.attributes; // TODO: return a clone
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

  getMarkdownDoc(): string {
    return new MarkdownDocBuilder()
      .blockTypeTitle(this.blockType)
      .description(this.docs.description)
      .attributes(
        Object.entries(this.attributes).map(([key, spec]) => [
          key,
          spec.docs?.description,
        ]),
      )
      .examples(this.docs.examples)
      .build();
  }

  getAttributeMarkdownDoc(attributeName: string): string | undefined {
    const attribute = this.attributes[attributeName];
    if (attribute === undefined || attribute.docs === undefined) {
      return undefined;
    }

    return new MarkdownDocBuilder()
      .attributeTitle(attributeName)
      .description(attribute.docs.description)
      .validation(attribute.docs.validation)
      .examples(attribute.docs.examples)
      .build();
  }
}
