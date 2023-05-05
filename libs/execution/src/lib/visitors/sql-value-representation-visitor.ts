// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  TextValuetype,
} from '../types/valuetypes';
// eslint-disable-next-line import/no-cycle
import { StandardRepresentationResolver } from '../types/valuetypes/standard-representation';
import { ValuetypeVisitor } from '../types/valuetypes/visitors/valuetype-visitor';

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
