import { ValidationAcceptor } from 'langium';

import { Attribute } from '../ast/generated/ast';
import { AttributeValueType } from '../ast/model-util';

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

export abstract class MetaInformation {
  protected constructor(
    public readonly type: string,
    private readonly attributes: Record<string, AttributeSpecification>,
  ) {}

  validate(attributes: Attribute[], accept: ValidationAcceptor): void {
    for (const attribute of attributes) {
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
}
