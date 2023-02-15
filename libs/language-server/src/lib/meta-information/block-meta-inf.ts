import { strict as assert } from 'assert';

import { ValidationAcceptor } from 'langium';

import { Attribute, AttributeType, Block } from '../ast';
import { IOType, UNDEFINED_TYPE } from '../types/io-types/io-type';

export interface AttributeSpecification {
  type: AttributeType;
  attributeDescription?: string;
  defaultValue?: unknown;
  validation?: (attribute: Attribute, accept: ValidationAcceptor) => void;
  validationDescription?: string;
  exampleUsageDescription?: string;
}

interface BlockDocs {
  description?: string;
  example?: string;
  validation?: string;
}

export abstract class BlockMetaInformation {
  docs: BlockDocs = {};

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

  getMarkdownDoc(): string {
    let attributesText = '## Attributes\n';
    Object.keys(this.attributes).forEach((v) => (attributesText += `- ${v}`));

    const validationText =
      this.docs.validation === undefined
        ? ''
        : `## Validation \n${this.docs.validation}`;

    const exampleText =
      this.docs.example === undefined
        ? ''
        : '## Example\n```\n' + `${this.docs.example}` + '\n```';

    return `# Block \`${this.blockType}\`
${this.docs.description ?? ''}
${attributesText}
${validationText}
${exampleText}
`;
  }

  getAttributeMarkdownDoc(attributeName: string): string | undefined {
    const attribute = this.attributes[attributeName];
    if (attribute === undefined) {
      return undefined;
    }

    const defaultValueText =
      attribute.defaultValue === undefined
        ? ''
        : `
Defaults to value \`${JSON.stringify(attribute.defaultValue)}\``;

    const validationText =
      attribute.validationDescription === undefined
        ? ''
        : `
## Validation
${attribute.validationDescription}`;

    const exampleText =
      attribute.exampleUsageDescription === undefined
        ? ''
        : `
## Example
\`\`\`
${attribute.exampleUsageDescription}
\`\`\``;

    return `# Attribute \`${attributeName}\`
${attribute.attributeDescription ?? ''}
${defaultValueText}
${validationText}
${exampleText}`;
  }
}
