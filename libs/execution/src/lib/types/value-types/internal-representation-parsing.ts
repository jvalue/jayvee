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

export interface ParseOpts {
  skipLeadingWhitespace: boolean;
  skipTrailingWhitespace: boolean;
}

const DEFAULT_PARSE_OPTS: ParseOpts = {
  skipLeadingWhitespace: true,
  skipTrailingWhitespace: true,
};

export function parseValueToInternalRepresentation<
  I extends InternalValueRepresentation,
>(
  value: string,
  valueType: ValueType<I>,
  parseOpts?: Partial<ParseOpts>,
): I | undefined {
  const visitor = new InternalRepresentationParserVisitor(value, {
    ...DEFAULT_PARSE_OPTS,
    ...parseOpts,
  });
  const result = valueType.acceptVisitor(visitor);
  if (!valueType.isInternalValueRepresentation(result)) {
    return undefined;
  }
  return result;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValueRepresentation | undefined
> {
  constructor(
    private value: string,
    private parseOpts: ParseOpts,
  ) {
    super();
  }

  private applyTrimOptions(value: string): string {
    // BUG: https://github.com/jvalue/jayvee/issues/646
    if (typeof this.value === 'string') {
      if (this.parseOpts.skipLeadingWhitespace) {
        value = value.trimStart();
      }
      if (this.parseOpts.skipTrailingWhitespace) {
        value = value.trimEnd();
      }
    }
    return value;
  }

  visitBoolean(vt: BooleanValuetype): boolean | undefined {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  visitDecimal(vt: DecimalValuetype): number | undefined {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  visitInteger(vt: IntegerValuetype): number | undefined {
    return vt.fromString(this.applyTrimOptions(this.value));
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
