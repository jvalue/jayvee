// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyAssignment, PropertyBody } from '../ast/generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../ast/model-util';
import { ValidationContext } from '../validation/validation-context';

export interface PropertySpecification {
  type: PropertyValuetype;
  defaultValue?: unknown;
  validation?: (
    property: PropertyAssignment,
    context: ValidationContext,
  ) => void;
  docs?: PropertyDocs;
}

export interface ExampleDoc {
  code: string;
  description: string;
}

export interface PropertyDocs {
  description?: string;
  examples?: ExampleDoc[];
  validation?: string;
}

export abstract class MetaInformation {
  protected constructor(
    public readonly type: string,
    private readonly properties: Record<string, PropertySpecification>,
    private readonly validation?: (
      property: PropertyBody,
      context: ValidationContext,
    ) => void,
  ) {}

  validate(propertyBody: PropertyBody, context: ValidationContext): void {
    for (const property of propertyBody.properties) {
      const propertySpecification = this.getPropertySpecification(
        property.name,
      );
      const propertyValidationFn = propertySpecification?.validation;
      if (propertyValidationFn === undefined) {
        continue;
      }
      propertyValidationFn(property, context);
    }

    if (this.validation !== undefined) {
      this.validation(propertyBody, context);
    }
  }

  getPropertySpecification(name: string): PropertySpecification | undefined {
    return this.properties[name];
  }

  getPropertySpecifications(): Record<string, PropertySpecification> {
    return this.properties;
  }

  hasPropertySpecification(name: string): boolean {
    return this.getPropertySpecification(name) !== undefined;
  }

  getPropertyNames(
    kind: 'optional' | 'required' | undefined = undefined,
    excludeNames: string[] = [],
  ): string[] {
    const resultingPropertyNames: string[] = [];
    for (const [name, spec] of Object.entries(this.properties)) {
      if (kind === 'optional' && spec.defaultValue === undefined) {
        continue;
      }
      if (kind === 'required' && spec.defaultValue !== undefined) {
        continue;
      }
      if (excludeNames.includes(name)) {
        continue;
      }
      resultingPropertyNames.push(name);
    }
    return resultingPropertyNames;
  }
}
