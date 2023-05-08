// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  TextValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

import { StandardRepresentationResolver } from '../standard-representation';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(valuetype: BooleanValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromBooleanValuetype(valuetype);
      return standardRepresentation ? String.raw`'true'` : String.raw`'false'`;
    };
  }

  visitDecimal(valuetype: DecimalValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromDecimalValuetype(valuetype);
      return standardRepresentation.toString();
    };
  }

  visitInteger(valuetype: IntegerValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromIntegerValuetype(valuetype);
      return standardRepresentation.toString();
    };
  }

  visitText(valuetype: TextValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromTextValuetype(valuetype);
      const escapedValueRepresentation = escapeSingleQuotes(
        standardRepresentation,
      );
      return `'${escapedValueRepresentation}'`;
    };
  }

  override visitAtomicValuetype(
    valuetype: AtomicValuetype,
  ): (value: unknown) => string {
    return valuetype.primitiveValuetype.acceptVisitor(this);
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
