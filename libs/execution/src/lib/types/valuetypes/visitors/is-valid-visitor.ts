// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

import { createConstraintExecutor } from '../../../constraints/constraint-executor-registry';
import { ExecutionContext } from '../../../execution-context';
import {
  BOOLEAN_STRING_REPRESENTATIONS,
  DECIMAL_COMMA_SEPARATOR_REGEX,
  DECIMAL_DOT_SEPARATOR_REGEX,
} from '../constants';

export class IsValidVisitor extends ValuetypeVisitor<boolean> {
  constructor(private value: unknown, private context: ExecutionContext) {
    super();
  }

  override visitBoolean(): boolean {
    if (typeof this.value === 'boolean') {
      return true;
    }
    if (typeof this.value === 'string') {
      return BOOLEAN_STRING_REPRESENTATIONS.includes(this.value);
    }

    return false;
  }

  override visitDecimal(): boolean {
    if (typeof this.value === 'string') {
      return (
        DECIMAL_DOT_SEPARATOR_REGEX.test(this.value) ||
        DECIMAL_COMMA_SEPARATOR_REGEX.test(this.value)
      );
    }

    return !Number.isNaN(this.value);
  }

  override visitInteger(): boolean {
    if (typeof this.value === 'string') {
      return /^[+-]?[0-9]+$/.test(this.value);
    }

    return Number.isInteger(this.value);
  }

  override visitText(): boolean {
    return typeof this.value === 'string';
  }

  override visitAtomicValuetype(valuetype: AtomicValuetype): boolean {
    if (!valuetype.acceptVisitor(this)) {
      return false;
    }

    const constraints = valuetype.getConstraints();
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

  override visitRegex(): boolean {
    throw new Error(
      'No visitor given for regex. Cannot be the type of a column.',
    );
  }

  override visitCellRange(): boolean {
    throw new Error(
      'No visitor given for cell ranges. Cannot be the type of a column.',
    );
  }

  override visitConstraint(): boolean {
    throw new Error(
      'No visitor given for constraints. Cannot be the type of a column.',
    );
  }

  override visitValuetypeAssignment(): boolean {
    throw new Error(
      'No visitor given for valuetype assignments. Cannot be the type of a column.',
    );
  }

  override visitCollection(): boolean {
    throw new Error(
      'No visitor given for collections. Cannot be the type of a column.',
    );
  }
}
