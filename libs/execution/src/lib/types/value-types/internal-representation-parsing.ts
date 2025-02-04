// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type DecimalValuetype,
  type IntegerValuetype,
  type InternalValueRepresentation,
  type TextValuetype,
  type ValueType,
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

export function parseValueToInternalRepresentation<
  I extends InternalValueRepresentation,
>(
  value: string,
  valueType: ValueType<I>,
  parseOpts?: ParseOpts,
): I | undefined {
  const visitor = new InternalRepresentationParserVisitor(
    value,
    parseOpts ?? { skipLeadingWhitespace: true, skipTrailingWhitespace: true },
  );
  const result = valueType.acceptVisitor(visitor);
  if (!valueType.isInternalValueRepresentation(result)) {
    return undefined;
  }
  return result;
}

export interface ParseOpts {
  skipLeadingWhitespace: boolean;
  skipTrailingWhitespace: boolean;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValueRepresentation | undefined
> {
  constructor(private value: string, private parseOpts: ParseOpts) {
    super();
  }

  private trim() {
    // BUG: https://github.com/jvalue/jayvee/issues/646
    if (typeof this.value !== 'string') {
      return;
    }
    if (this.parseOpts.skipLeadingWhitespace) {
      this.value = this.value.trimStart();
    }
    if (this.parseOpts.skipTrailingWhitespace) {
      this.value = this.value.trimEnd();
    }
  }

  visitBoolean(vt: BooleanValuetype): boolean | undefined {
    this.trim();
    return vt.fromString(this.value);
  }

  visitDecimal(vt: DecimalValuetype): number | undefined {
    this.trim();
    return vt.fromString(this.value);
  }

  visitInteger(vt: IntegerValuetype): number | undefined {
    this.trim();
    return vt.fromString(this.value);
  }

  visitText(vt: TextValuetype): string {
    return vt.fromString(this.value);
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
