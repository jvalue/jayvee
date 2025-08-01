// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type DecimalValuetype,
  INVALID_TYPEGUARD,
  type IntegerValuetype,
  type InternalErrorRepresentation,
  type InternalValueRepresentation,
  InvalidError,
  type TextValuetype,
  type ValueType,
  ValueTypeVisitor,
  internalValueToString,
  isCellRangeLiteral,
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
): I | InternalErrorRepresentation {
  const visitor = new InternalRepresentationParserVisitor(value, {
    ...DEFAULT_PARSE_OPTS,
    ...parseOpts,
  });
  const result = valueType.acceptVisitor(visitor);
  if (INVALID_TYPEGUARD(result)) {
    return result;
  }

  if (!valueType.isInternalValueRepresentation(result)) {
    if (isCellRangeLiteral(result)) {
      return new InvalidError(
        `A cell range literal is not valid for ${valueType.getName()}`,
      );
    }
    return new InvalidError(
      `${internalValueToString(
        result,
      )} is not valid for ${valueType.getName()}`,
    );
  }
  return result;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValueRepresentation | InvalidError
> {
  constructor(private value: string, private parseOpts: ParseOpts) {
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

  visitBoolean(vt: BooleanValuetype): boolean | InvalidError {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  visitDecimal(vt: DecimalValuetype): number | InvalidError {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  visitInteger(vt: IntegerValuetype): number | InvalidError {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  visitText(vt: TextValuetype): string {
    return vt.fromString(this.value);
  }

  visitAtomicValueType(
    valueType: AtomicValueType,
  ): InternalValueRepresentation | InvalidError {
    const contained = valueType.getContainedType();
    assert(contained !== undefined);

    return contained.acceptVisitor(this);
  }

  visitCellRange(): InvalidError {
    return new InvalidError(`Cannot parse cell ranges into internal values`);
  }

  visitCollection(): InvalidError {
    return new InvalidError(`Cannot parse collections into internal values`);
  }

  visitConstraint(): InvalidError {
    return new InvalidError(`Cannot parse constraints into internal values`);
  }

  visitRegex(): InvalidError {
    return new InvalidError(`Cannot parse regex into internal values`);
  }

  visitTransform(): InvalidError {
    return new InvalidError(`Cannot parse transforms into internal values`);
  }

  visitValuetypeAssignment(): InvalidError {
    return new InvalidError(
      `Cannot parse valuetype assignments into internal values`,
    );
  }
}
