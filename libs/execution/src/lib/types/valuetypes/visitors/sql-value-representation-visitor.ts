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

  override visitRegex(): (value: unknown) => string {
    throw new Error(
      'No visitor given for regex. Cannot be the type of a column.',
    );
  }

  override visitCellRange(): (value: unknown) => string {
    throw new Error(
      'No visitor given for cell ranges. Cannot be the type of a column.',
    );
  }

  override visitConstraint(): (value: unknown) => string {
    throw new Error(
      'No visitor given for constraints. Cannot be the type of a column.',
    );
  }

  override visitValuetypeAssignment(): (value: unknown) => string {
    throw new Error(
      'No visitor given for valuetype assignments. Cannot be the type of a column.',
    );
  }

  override visitCollection(): (value: unknown) => string {
    throw new Error(
      'No visitor given for collections. Cannot be the type of a column.',
    );
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
