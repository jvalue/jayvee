// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type CellRangeValuetype,
  type CollectionValueType,
  type ConstraintValuetype,
  type DecimalValuetype,
  type IntegerValuetype,
  type InternalValueRepresentation,
  type PrimitiveValueType,
  type RegexValuetype,
  type TextValuetype,
  type TransformValuetype,
  type ValueType,
  ValueTypeVisitor,
  type ValuetypeAssignmentValuetype,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context';

export function isValidValueRepresentation(
  value: InternalValueRepresentation,
  valueType: ValueType,
  context: ExecutionContext,
): boolean {
  const visitor = new ValueRepresentationValidityVisitor(value, context);
  return valueType.acceptVisitor(visitor);
}

class ValueRepresentationValidityVisitor extends ValueTypeVisitor<boolean> {
  constructor(
    private value: InternalValueRepresentation,
    private context: ExecutionContext,
  ) {
    super();
  }

  override visitAtomicValueType(valueType: AtomicValueType): boolean {
    const supertype = valueType.getSupertype();
    assert(supertype !== undefined);
    if (!supertype.acceptVisitor(this)) {
      return false;
    }

    const constraints = valueType.getConstraints(
      this.context.evaluationContext,
    );
    for (const constraint of constraints) {
      const constraintExecutor =
        this.context.constraintExtension.createConstraintExecutor(constraint);

      this.context.enterNode(constraint);
      const valueFulfilledConstraint = constraintExecutor.isValid(
        this.value,
        this.context,
      );
      this.context.exitNode(constraint);

      if (!valueFulfilledConstraint) {
        return false;
      }
    }

    return true;
  }

  override visitBoolean(valueType: BooleanValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitDecimal(valueType: DecimalValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitInteger(valueType: IntegerValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitText(valueType: TextValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitRegex(valueType: RegexValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitCellRange(valueType: CellRangeValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitConstraint(valueType: ConstraintValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitValuetypeAssignment(
    valueType: ValuetypeAssignmentValuetype,
  ): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitCollection(valueType: CollectionValueType): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitTransform(valueType: TransformValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  private isValidForPrimitiveValuetype(valueType: PrimitiveValueType): boolean {
    return valueType.isInternalValueRepresentation(this.value);
  }
}
