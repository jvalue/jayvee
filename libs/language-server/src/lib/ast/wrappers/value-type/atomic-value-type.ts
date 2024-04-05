// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

// eslint-disable-next-line import/no-cycle
import { evaluateExpression } from '../../expressions/evaluate-expression';
import { type EvaluationContext } from '../../expressions/evaluation-context';
import { type InternalValueRepresentation } from '../../expressions/internal-value-representation';
import { ConstraintDefinition, ValuetypeDefinition } from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

// eslint-disable-next-line import/no-cycle
import { CollectionValuetype } from './primitive';
import { PrimitiveValuetypes } from './primitive/primitive-value-types';
import { AbstractValueType, ValueType, ValueTypeVisitor } from './value-type';
// eslint-disable-next-line import/no-cycle
import { createValueType } from './value-type-util';

export class AtomicValueType
  extends AbstractValueType<InternalValueRepresentation>
  implements AstNodeWrapper<ValuetypeDefinition>
{
  constructor(public readonly astNode: ValuetypeDefinition) {
    super();
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitAtomicValuetype(this);
  }

  getConstraints(
    context: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
  ): ConstraintDefinition[] {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const constraintCollection = this.astNode?.constraints;
    assert(constraintCollection !== undefined);
    const constraintCollectionType = new CollectionValuetype(
      PrimitiveValuetypes.Constraint,
    );
    const constraints =
      evaluateExpression(constraintCollection, context, wrapperFactories) ?? [];
    if (!constraintCollectionType.isInternalValueRepresentation(constraints)) {
      return [];
    }

    return constraints;
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
    const supertype = this.astNode?.type;
    return createValueType(supertype);
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

export function isAtomicValuetype(v: unknown): v is AtomicValueType {
  return v instanceof AtomicValueType;
}
