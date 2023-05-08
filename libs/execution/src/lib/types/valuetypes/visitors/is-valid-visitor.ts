// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

import { createConstraintExecutor } from '../../../constraints/constraint-executor-registry';
import { ExecutionContext } from '../../../execution-context';

export class IsValidVisitor extends ValuetypeVisitor<boolean> {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];
  private readonly DECIMAL_DOT_SEPARATOR_REGEX = /^[+-]?([0-9]*[.])?[0-9]+$/;
  private readonly DECIMAL_COMMA_SEPARATOR_REGEX = /^[+-]?([0-9]*[,])?[0-9]+$/;

  constructor(private value: unknown, private context: ExecutionContext) {
    super();
  }

  override visitBoolean(): boolean {
    if (typeof this.value === 'boolean') {
      return true;
    }
    if (typeof this.value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(this.value);
    }

    return false;
  }

  override visitDecimal(): boolean {
    if (typeof this.value === 'string') {
      return (
        this.DECIMAL_DOT_SEPARATOR_REGEX.test(this.value) ||
        this.DECIMAL_COMMA_SEPARATOR_REGEX.test(this.value)
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
    if (!valuetype.primitiveValuetype.acceptVisitor(this)) {
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
}
