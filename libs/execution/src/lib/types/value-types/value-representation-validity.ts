// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type CellRangeValuetype,
  type CollectionValueType,
  type ConstraintValuetype,
  type DecimalValuetype,
  type IntegerValuetype,
  type InternalValidValueRepresentation,
  type PrimitiveValueType,
  type RegexValuetype,
  type TextValuetype,
  type TransformValuetype,
  type ValueType,
  ValueTypeVisitor,
  type ValuetypeAssignmentValuetype,
  isConstraintDefinition,
} from '@jvalue/jayvee-language-server';

import { ConstraintExecutor } from '../../constraints';
import { type ExecutionContext } from '../../execution-context';

export function isValidValueRepresentation(
  value: InternalValidValueRepresentation,
  valueType: ValueType,
  context: ExecutionContext,
): boolean {
  const visitor = new ValueRepresentationValidityVisitor(value, context);
  return valueType.acceptVisitor(visitor);
}

class ValueRepresentationValidityVisitor extends ValueTypeVisitor<boolean> {
  constructor(
    private value: InternalValidValueRepresentation,
    private context: ExecutionContext,
  ) {
    super();
  }

  override visitAtomicValueType(valueType: AtomicValueType): boolean {
    const containedTypes = valueType.getContainedTypes();
    assert(containedTypes !== undefined);
    const allPropertiesValid = containedTypes.every((containedType) =>
      containedType.acceptVisitor(this),
    );
    if (!allPropertiesValid) {
      return false;
    }

    for (const constraint of valueType.getConstraints()) {
      this.context.enterNode(constraint);

      const valueFulfilledConstraint = isConstraintDefinition(constraint)
        ? new ConstraintExecutor(constraint).isValid(this.value, this.context)
        : new ConstraintExecutor(constraint).isValid(
            this.value,
            this.context,
            valueType.getProperties(),
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
    return valueType.isInternalValidValueRepresentation(this.value);
  }
}
