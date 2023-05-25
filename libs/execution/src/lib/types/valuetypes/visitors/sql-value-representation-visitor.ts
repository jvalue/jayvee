// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AtomicValuetype,
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  InternalValueRepresentation,
  TextValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: InternalValueRepresentation) => string
> {
  visitBoolean(
    valuetype: BooleanValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valuetype.isInternalValueRepresentation(value));
      return value ? `'true'` : `'false'`;
    };
  }

  visitDecimal(
    valuetype: DecimalValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valuetype.isInternalValueRepresentation(value));
      return value.toString();
    };
  }

  visitInteger(
    valuetype: IntegerValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valuetype.isInternalValueRepresentation(value));
      return value.toString();
    };
  }

  visitText(
    valuetype: TextValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valuetype.isInternalValueRepresentation(value));
      const escapedValue = escapeSingleQuotes(value);
      return `'${escapedValue}'`;
    };
  }

  override visitAtomicValuetype(
    valuetype: AtomicValuetype,
  ): (value: InternalValueRepresentation) => string {
    const supertype = valuetype.getSupertype();
    assert(supertype !== undefined);
    return supertype.acceptVisitor(this);
  }

  override visitRegex(): (value: InternalValueRepresentation) => string {
    throw new Error(
      'No visit implementation given for regex. Cannot be the type of a column.',
    );
  }

  override visitCellRange(): (value: InternalValueRepresentation) => string {
    throw new Error(
      'No visit implementation given for cell ranges. Cannot be the type of a column.',
    );
  }

  override visitConstraint(): (value: InternalValueRepresentation) => string {
    throw new Error(
      'No visit implementation given for constraints. Cannot be the type of a column.',
    );
  }

  override visitValuetypeAssignment(): (
    value: InternalValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for valuetype assignments. Cannot be the type of a column.',
    );
  }

  override visitCollection(): (value: InternalValueRepresentation) => string {
    throw new Error(
      'No visit implementation given for collections. Cannot be the type of a column.',
    );
  }

  override visitTransform(): (value: InternalValueRepresentation) => string {
    throw new Error(
      'No visit implementation given for transforms. Cannot be the type of a column.',
    );
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
