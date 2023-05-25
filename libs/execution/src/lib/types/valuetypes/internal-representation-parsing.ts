// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AtomicValuetype,
  InternalValueRepresentation,
  Valuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

const DECIMAL_COMMA_SEPARATOR_REGEX = /^[+-]?([0-9]*[,])?[0-9]+$/;
const DECIMAL_DOT_SEPARATOR_REGEX = /^[+-]?([0-9]*[.])?[0-9]+$/;

const INTEGER_REGEX = /^[+-]?[0-9]+$/;

const TRUE_REGEX = /^true$/i;
const FALSE_REGEX = /^false$/i;

export function parseValueToInternalRepresentation(
  value: string,
  valuetype: Valuetype,
): InternalValueRepresentation | undefined {
  const visitor = new InternalRepresentationParserVisitor(value);
  return valuetype.acceptVisitor(visitor);
}

class InternalRepresentationParserVisitor extends ValuetypeVisitor<
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
    let sanitizedValue: string;
    if (DECIMAL_COMMA_SEPARATOR_REGEX.test(this.value)) {
      sanitizedValue = this.value.replace(',', '.');
    } else if (DECIMAL_DOT_SEPARATOR_REGEX.test(this.value)) {
      sanitizedValue = this.value;
    } else {
      return undefined;
    }

    return Number.parseFloat(sanitizedValue);
  }

  visitInteger(): number | undefined {
    if (!INTEGER_REGEX.test(this.value)) {
      return undefined;
    }

    return Number.parseInt(this.value, 10);
  }

  visitText(): string {
    return this.value;
  }

  visitAtomicValuetype(
    valuetype: AtomicValuetype,
  ): InternalValueRepresentation | undefined {
    const supertype = valuetype.getSupertype();
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
