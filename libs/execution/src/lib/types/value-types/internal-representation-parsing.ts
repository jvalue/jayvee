// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type InternalValueRepresentation,
  type ValueType,
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

const NUMBER_REGEX = /^[+-]?([0-9]*[,.])?[0-9]+([eE][+-]?\d+)?$/;

const TRUE_REGEX = /^true$/i;
const FALSE_REGEX = /^false$/i;

export function parseValueToInternalRepresentation<
  I extends InternalValueRepresentation,
>(value: string, valueType: ValueType<I>): I | undefined {
  const visitor = new InternalRepresentationParserVisitor(value);
  const result = valueType.acceptVisitor(visitor);
  if (!valueType.isInternalValueRepresentation(result)) {
    return undefined;
  }
  return result;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValueRepresentation | undefined
> {
  constructor(private value: string) {
    super();
  }

  visitBoolean(): boolean | undefined {
    if (TRUE_REGEX.test(this.value)) {
      return true;
    } else if (FALSE_REGEX.test(this.value)) {
      return false;
    }
    return undefined;
  }

  visitDecimal(): number | undefined {
    if (!NUMBER_REGEX.test(this.value)) {
      return undefined;
    }

    return Number.parseFloat(this.value.replace(',', '.'));
  }

  visitInteger(): number | undefined {
    /**
     * Reuse decimal number parsing to capture valid scientific notation
     * of integers like 5.3e3 = 5300. In contrast to decimal, if the final number
     * is not a valid integer, returns undefined.
     */
    const decimalNumber = this.visitDecimal();

    if (decimalNumber === undefined) {
      return undefined;
    }

    const integerNumber = Math.trunc(decimalNumber);

    if (decimalNumber !== integerNumber) {
      return undefined;
    }

    return integerNumber;
  }

  visitText(): string {
    return this.value;
  }

  visitAtomicValueType(
    valueType: AtomicValueType,
  ): InternalValueRepresentation | undefined {
    const supertype = valueType.getSupertype();
    assert(supertype !== undefined);

    return supertype.acceptVisitor(this);
  }

  visitCellRange(): undefined {
    return undefined;
  }

  visitCollection(): undefined {
    return undefined;
  }

  visitConstraint(): undefined {
    return undefined;
  }

  visitRegex(): undefined {
    return undefined;
  }

  visitTransform(): undefined {
    return undefined;
  }

  visitValuetypeAssignment(): undefined {
    return undefined;
  }
}
