// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

import { StandardRepresentationResolver } from '../standard-representation';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromBooleanValuetype();
      return standardRepresentation ? String.raw`'true'` : String.raw`'false'`;
    };
  }

  visitDecimal(): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromDecimalValuetype();
      return standardRepresentation.toString();
    };
  }

  visitInteger(): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromIntegerValuetype();
      return standardRepresentation.toString();
    };
  }

  visitText(): (value: unknown) => string {
    return (value: unknown) => {
      const standardRepresentation = new StandardRepresentationResolver(
        value,
      ).fromTextValuetype();
      const escapedValueRepresentation = escapeSingleQuotes(
        standardRepresentation,
      );
      return `'${escapedValueRepresentation}'`;
    };
  }

  override visitAtomicValuetype(
    valuetype: AtomicValuetype,
  ): (value: unknown) => string {
    return valuetype.acceptVisitor(this);
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
