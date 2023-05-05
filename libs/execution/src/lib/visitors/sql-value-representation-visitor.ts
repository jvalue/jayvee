// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  PrimitiveType,
  TextValuetype,
} from '../types/valuetypes';
import { ValuetypeVisitor } from '../types/valuetypes/visitors/valuetype-visitor';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(valuetype: BooleanValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value)
        ? String.raw`'true'`
        : String.raw`'false'`;
    };
  }
  visitDecimal(valuetype: DecimalValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value).toString();
    };
  }
  visitInteger(valuetype: IntegerValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value).toString();
    };
  }
  visitText(valuetype: TextValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardValueRepresentation =
        valuetype.getStandardRepresentation(value);
      const escapedValueRepresentation = escapeSingleQuotes(
        standardValueRepresentation,
      );
      return `'${escapedValueRepresentation}'`;
    };
  }

  override visitAtomicValuetype<T extends PrimitiveType>(
    valuetype: AtomicValuetype<T>,
  ): (value: unknown) => string {
    return valuetype.primitiveValuetype.acceptVisitor(this);
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
