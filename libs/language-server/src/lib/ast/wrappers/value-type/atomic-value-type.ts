// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type InternalValueRepresentation } from '../../expressions/internal-value-representation';
import {
  type ConstraintDefinition,
  type ValueTypeAttribute,
  type ValueTypeConstraintInlineDefinition,
  type ValuetypeDefinition,
  isValueTypeConstraintInlineDefinition,
} from '../../generated/ast';
import { type AstNodeWrapper } from '../ast-node-wrapper';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

import { AbstractValueType } from './abstract-value-type';
import { type ValueTypeProvider } from './primitive';
import { type ValueType, type ValueTypeVisitor } from './value-type';

export class AtomicValueType
  extends AbstractValueType<InternalValueRepresentation>
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

  getAttribute(): ValueTypeAttribute | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.astNode?.attribute;
  }

  getConstraints(): (
    | ConstraintDefinition
    | ValueTypeConstraintInlineDefinition
  )[] {
    return (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this.astNode?.constraints?.map((constraint) => {
        if (isValueTypeConstraintInlineDefinition(constraint)) {
          return constraint;
          // eslint-disable-next-line no-else-return
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const constraintDefinition = constraint?.definition?.ref;
          assert(
            this.valueTypeProvider.Primitives.Constraint.isInternalValueRepresentation(
              constraintDefinition,
            ),
          );
          return constraintDefinition;
        }
      }) ?? []
    );
  }

  override isConvertibleTo(target: ValueType): boolean {
    if (target.equals(this)) {
      return true;
    }

    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isConvertibleTo(target);
  }

  override isReferenceableByUser(): boolean {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isReferenceableByUser();
  }

  override isAllowedAsRuntimeParameter(): boolean {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isAllowedAsRuntimeParameter();
  }

  override getName(): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.astNode.name ?? '';
  }

  protected override doGetSupertype(): ValueType | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const supertype = this.astNode?.attribute?.valueType;
    return this.wrapperFactories.ValueType.wrap(supertype);
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is InternalValueRepresentation {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isInternalValueRepresentation(operandValue);
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
