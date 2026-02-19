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
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  InvalidValue,
  type TextValuetype,
  type ValueType,
  ValueTypeVisitor,
  onlyElementOrUndefined,
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
  I extends InternalValidValueRepresentation,
>(
  value: string,
  valueType: ValueType<I>,
  parseOpts?: Partial<ParseOpts>,
): I | InternalErrorValueRepresentation {
  const visitor = new InternalRepresentationParserVisitor(value, {
    ...DEFAULT_PARSE_OPTS,
    ...parseOpts,
  });
  const result = valueType.acceptVisitor(visitor);
  if (INVALID_TYPEGUARD(result)) {
    return result;
  }

  if (!valueType.isInternalValidValueRepresentation(result)) {
    if (isCellRangeLiteral(result)) {
      return new InvalidValue(
        `A cell range literal is not valid for ${valueType.getName()}`,
      );
    }
    return new InvalidValue(
      `${internalValueToString(
        result,
      )} is not valid for ${valueType.getName()}`,
    );
  }
  return result;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValidValueRepresentation | InvalidValue
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

  override visitBoolean(vt: BooleanValuetype): boolean | InvalidValue {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  override visitDecimal(vt: DecimalValuetype): number | InvalidValue {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  override visitInteger(vt: IntegerValuetype): number | InvalidValue {
    return vt.fromString(this.applyTrimOptions(this.value));
  }

  override visitText(vt: TextValuetype): string {
    return vt.fromString(this.value);
  }

  override visitAtomicValueType(
    valueType: AtomicValueType,
  ): InternalValidValueRepresentation | InvalidValue {
    const containedTypes = valueType.getContainedTypes();
    assert(containedTypes !== undefined);
    const containedType = onlyElementOrUndefined(containedTypes);
    if (containedType === undefined) {
      return new InvalidValue(
        `Cannot parse value types with multiple properties`,
      );
    }
    return containedType.acceptVisitor(this);
  }

  override visitCellRange(): InvalidValue {
    return new InvalidValue(`Cannot parse cell ranges into internal values`);
  }

  override visitCollection(): InvalidValue {
    return new InvalidValue(`Cannot parse collections into internal values`);
  }

  override visitConstraint(): InvalidValue {
    return new InvalidValue(`Cannot parse constraints into internal values`);
  }

  override visitRegex(): InvalidValue {
    return new InvalidValue(`Cannot parse regex into internal values`);
  }

  override visitTransform(): InvalidValue {
    return new InvalidValue(`Cannot parse transforms into internal values`);
  }

  override visitValuetypeAssignment(): InvalidValue {
    return new InvalidValue(
      `Cannot parse valuetype assignments into internal values`,
    );
  }

  override visitValuetypeDefinition(): InvalidValue {
    return new InvalidValue(
      `Cannot parse valuetype definitions into internal values`,
    );
  }

  override visitSheetRow(): InvalidValue {
    return new InvalidValue(`Cannot parse sheet rows into internal values`);
  }
}
