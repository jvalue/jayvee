// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { PropertyAssignment } from '../ast/generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../ast/model-util';

export interface PropertySpecification {
  type: PropertyValuetype;
  defaultValue?: unknown;
  validation?: (
    property: PropertyAssignment,
    accept: ValidationAcceptor,
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
  ) {}

  validate(properties: PropertyAssignment[], accept: ValidationAcceptor): void {
    for (const property of properties) {
      const propertySpecification = this.getPropertySpecification(
        property.name,
      );
      const propertyValidationFn = propertySpecification?.validation;
      if (propertyValidationFn === undefined) {
        continue;
      }
      propertyValidationFn(property, accept);
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
