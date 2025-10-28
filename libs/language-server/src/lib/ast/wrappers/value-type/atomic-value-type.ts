// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type InternalValidValueRepresentation } from '../../expressions/internal-value-representation';
import {} from '../../expressions/typeguards';
import {
  type ConstraintDefinition,
  type ValueTypeProperty,
  type ValueTypeConstraintInlineDefinition,
  type ValuetypeDefinition,
  isValueTypeConstraintInlineDefinition,
} from '../../generated/ast';
import { type AstNodeWrapper } from '../ast-node-wrapper';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

import { AbstractValueType } from './abstract-value-type';
import { type ValueTypeProvider } from './primitive';
import { type ValueType, type ValueTypeVisitor } from './value-type';
import { onlyElementOrUndefined } from '../../../util';
import { type AstNode, type DiagnosticInfo, type Reference } from 'langium';
import { type ValidationContext } from '../../../validation';

export class AtomicValueType
  extends AbstractValueType<InternalValidValueRepresentation>
  implements AstNodeWrapper<ValuetypeDefinition>
{
  constructor(
    public readonly astNode: ValuetypeDefinition,
    private readonly valueTypeProvider: ValueTypeProvider,
    private readonly wrapperFactories: WrapperFactoryProvider,
  ) {
    super();
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitAtomicValueType(this);
  }

  getProperties(): ValueTypeProperty[] {
    return this.astNode?.properties;
  }

  getProperty(name: string): ValueTypeProperty | undefined;
  getProperty(
    reference: Reference<ValueTypeProperty>,
    validationContext?: ValidationContext,
  ): ValueTypeProperty | undefined;
  getProperty(
    reference: string | Reference<ValueTypeProperty>,
    validationContext?: ValidationContext,
  ): ValueTypeProperty | undefined {
    let propertyName: string | undefined = undefined;

    if (typeof reference === 'string') {
      propertyName = reference;
    } else if (reference.ref !== undefined) {
      propertyName = reference.ref.name;
    } else if (
      reference.error !== undefined &&
      validationContext !== undefined
    ) {
      const info: DiagnosticInfo<AstNode> = {
        node: reference.error.info.container,
        property: reference.error.info.property,
      };
      if (reference.error.info.index !== undefined) {
        info.index = reference.error.info.index;
      }
      validationContext.accept('error', reference.error.message, info);
    }

    return this.astNode?.properties.find(
      (property) => property.name == propertyName,
    );
  }

  getConstraints(): (
    | ConstraintDefinition
    | ValueTypeConstraintInlineDefinition
  )[] {
    const result: (
      | ConstraintDefinition
      | ValueTypeConstraintInlineDefinition
    )[] = [];

    const constraints = this.astNode?.constraints;

    if (constraints === undefined) {
      return result;
    }

    for (const constraint of constraints) {
      if (isValueTypeConstraintInlineDefinition(constraint)) {
        result.push(constraint);
        continue;
      }

      const constraintDefinition = constraint?.definition?.ref;
      if (constraintDefinition === undefined) {
        continue;
      }

      assert(
        this.valueTypeProvider.Primitives.Constraint.isInternalValidValueRepresentation(
          constraintDefinition,
        ),
      );
      result.push(constraintDefinition);
    }

    return result;
  }

  override isConvertibleTo(target: ValueType): boolean {
    if (target.equals(this)) {
      return true;
    }

    const containedTypes = this.getContainedTypes();
    if (containedTypes === undefined) {
      return false;
    }
    const containedType = onlyElementOrUndefined(containedTypes);
    if (containedType === undefined) {
      return false;
    }
    return containedType.isConvertibleTo(target);
  }

  override isReferenceableByUser(): boolean {
    const containedTypes = this.getContainedTypes();
    if (containedTypes === undefined || containedTypes.length === 0) {
      return false;
    }
    return containedTypes.every((containedType) =>
      containedType.isReferenceableByUser(),
    );
  }

  override isAllowedAsRuntimeParameter(): boolean {
    const containedTypes = this.getContainedTypes();
    if (containedTypes === undefined || containedTypes.length === 0) {
      return false;
    }
    return containedTypes.every((containedType) =>
      containedType.isAllowedAsRuntimeParameter(),
    );
  }

  override getName(): string {
    return this.astNode.name ?? '';
  }

  protected override doGetContainedTypes(): ValueType[] {
    return (
      this.astNode?.properties?.map((property) => {
        const valueType = this.wrapperFactories.ValueType.wrap(
          property.valueType,
        );
        assert(valueType !== undefined);
        return valueType;
      }) ?? []
    );
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is InternalValidValueRepresentation {
    const containedTypes = this.getContainedTypes();
    if (containedTypes === undefined) {
      return false;
    }
    const containedType = onlyElementOrUndefined(containedTypes);
    if (containedType === undefined) {
      return false;
    }
    return containedType.isInternalValidValueRepresentation(operandValue);
  }

  override equals(target: ValueType): boolean {
    if (target instanceof AtomicValueType) {
      return this.astNode === target.astNode;
    }
    return false;
  }
}

export function isAtomicValueType(v: unknown): v is AtomicValueType {
  return v instanceof AtomicValueType;
}
