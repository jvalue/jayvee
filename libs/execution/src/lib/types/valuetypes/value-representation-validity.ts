// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AtomicValuetype,
  BooleanValuetype,
  CellRangeValuetype,
  CollectionValuetype,
  ConstraintValuetype,
  DecimalValuetype,
  IntegerValuetype,
  InternalValueRepresentation,
  PrimitiveValuetype,
  RegexValuetype,
  TextValuetype,
  TransformValuetype,
  Valuetype,
  ValuetypeAssignmentValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

import { createConstraintExecutor } from '../../constraints/constraint-executor-registry';
import { type ExecutionContext } from '../../execution-context';

export function isValidValueRepresentation(
  value: InternalValueRepresentation,
  valuetype: Valuetype,
  context: ExecutionContext,
): boolean {
  const visitor = new ValueRepresentationValidityVisitor(value, context);
  return valuetype.acceptVisitor(visitor);
}

class ValueRepresentationValidityVisitor extends ValuetypeVisitor<boolean> {
  constructor(
    private value: InternalValueRepresentation,
    private context: ExecutionContext,
  ) {
    super();
  }

  override visitAtomicValuetype(valuetype: AtomicValuetype): boolean {
    const supertype = valuetype.getSupertype();
    assert(supertype !== undefined);
    if (!supertype.acceptVisitor(this)) {
      return false;
    }

    const constraints = valuetype.getConstraints(
      this.context.evaluationContext,
    );
    for (const constraint of constraints) {
      const constraintExecutor = createConstraintExecutor(constraint);

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

  override visitBoolean(valuetype: BooleanValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitDecimal(valuetype: DecimalValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitInteger(valuetype: IntegerValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitText(valuetype: TextValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitRegex(valuetype: RegexValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitCellRange(valuetype: CellRangeValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitConstraint(valuetype: ConstraintValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitValuetypeAssignment(
    valuetype: ValuetypeAssignmentValuetype,
  ): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitCollection(valuetype: CollectionValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  override visitTransform(valuetype: TransformValuetype): boolean {
    return this.isValidForPrimitiveValuetype(valuetype);
  }

  private isValidForPrimitiveValuetype(valuetype: PrimitiveValuetype): boolean {
    return valuetype.isInternalValueRepresentation(this.value);
  }
}
