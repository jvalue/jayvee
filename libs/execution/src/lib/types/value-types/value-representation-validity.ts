// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type TableRowValueType,
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
  type ValuetypeDefinitionValuetype,
  type InternalErrorValueRepresentation,
} from '@jvalue/jayvee-language-server';

import { ConstraintExecutor } from '../../constraints';
import { type ExecutionContext } from '../../execution-context';

export function isValidValueRepresentation(
  value: InternalValidValueRepresentation,
  valueType: ValueType,
  context: ExecutionContext,
): boolean {
  const values = new Map<string, InternalValidValueRepresentation>();
  values.set('value', value);
  const visitor = new ValueRepresentationValidityVisitor(values, context);
  return valueType.acceptVisitor(visitor);
}

export function allValueRepresentationsValid(
  values: Map<string, InternalValidValueRepresentation>,
  atomicValueType: AtomicValueType,
  context: ExecutionContext,
): boolean {
  const visitor = new ValueRepresentationValidityVisitor(values, context);
  return atomicValueType.acceptVisitor(visitor);
}

class ValueRepresentationValidityVisitor extends ValueTypeVisitor<boolean> {
  constructor(
    private values: Map<
      string,
      InternalValidValueRepresentation | InternalErrorValueRepresentation
    >,
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

      const valueFulfilledConstraint = new ConstraintExecutor(
        constraint,
      ).isValid(this.values, this.context);

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

  override visitValuetypeDefinition(
    valueType: ValuetypeDefinitionValuetype,
  ): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitCollection(valueType: CollectionValueType): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitTableRow(valueType: TableRowValueType): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  override visitTransform(valueType: TransformValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valueType);
  }

  private isValidForPrimitiveValuetype(valueType: PrimitiveValueType): boolean {
    const value = this.values.get('value');
    assert(value !== undefined);
    return valueType.isInternalValidValueRepresentation(value);
  }
}
