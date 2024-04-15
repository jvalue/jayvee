// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode } from 'langium';

import { type ValidationContext } from '../../../validation/validation-context';
import { type EvaluationContext } from '../../expressions/evaluation-context';
import { type InternalValueRepresentation } from '../../expressions/internal-value-representation';
import {
  type PropertyAssignment,
  type PropertyBody,
} from '../../generated/ast';
import { type AstNodeWrapper } from '../ast-node-wrapper';
import { type ValueType } from '../value-type';

export interface PropertySpecification<
  I extends InternalValueRepresentation = InternalValueRepresentation,
> {
  type: ValueType<I>;
  defaultValue?: I;
  validation?: (
    property: PropertyAssignment,
    validationContext: ValidationContext,
    evaluationContext: EvaluationContext,
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

export abstract class TypedObjectWrapper<N extends AstNode = AstNode>
  implements AstNodeWrapper<N>
{
  protected constructor(
    public readonly astNode: N,
    public readonly type: string,
    private readonly properties: Record<string, PropertySpecification>,
    private readonly validation?: (
      property: PropertyBody,
      validationContext: ValidationContext,
      evaluationContext: EvaluationContext,
    ) => void,
  ) {}

  validate(
    propertyBody: PropertyBody,
    validationContext: ValidationContext,
    evaluationContext: EvaluationContext,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const properties = propertyBody?.properties ?? [];
    for (const property of properties) {
      const propertySpecification = this.getPropertySpecification(
        property.name,
      );
      const propertyValidationFn = propertySpecification?.validation;
      if (propertyValidationFn === undefined) {
        continue;
      }
      propertyValidationFn(property, validationContext, evaluationContext);
    }

    if (this.validation !== undefined) {
      this.validation(propertyBody, validationContext, evaluationContext);
    }
  }

  getPropertySpecification(
    name: string | undefined,
  ): PropertySpecification | undefined {
    if (name === undefined) {
      return undefined;
    }
    return this.properties[name];
  }

  getPropertySpecifications(): Record<string, PropertySpecification> {
    return this.properties;
  }

  hasPropertySpecification(name: string): boolean {
    return this.getPropertySpecification(name) !== undefined;
  }

  getMissingRequiredPropertyNames(
    presentPropertyNames: string[] = [],
  ): string[] {
    return this.getPropertyNames('required', presentPropertyNames);
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
