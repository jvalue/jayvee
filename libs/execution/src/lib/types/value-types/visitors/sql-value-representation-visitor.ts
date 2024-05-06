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
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

export class SQLValueRepresentationVisitor extends ValueTypeVisitor<
  (value: InternalValueRepresentation) => string
> {
  visitBoolean(
    valueType: BooleanValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valueType.isInternalValueRepresentation(value));
      return value ? `'true'` : `'false'`;
    };
  }

  visitDecimal(
    valueType: DecimalValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valueType.isInternalValueRepresentation(value));
      return value.toString();
    };
  }

  visitInteger(
    valueType: IntegerValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valueType.isInternalValueRepresentation(value));
      return value.toString();
    };
  }

  visitText(
    valueType: TextValuetype,
  ): (value: InternalValueRepresentation) => string {
    return (value: InternalValueRepresentation) => {
      assert(valueType.isInternalValueRepresentation(value));
      const escapedValue = escapeSingleQuotes(value);
      return `'${escapedValue}'`;
    };
  }

  override visitAtomicValueType(
    valueType: AtomicValueType,
  ): (value: InternalValueRepresentation) => string {
    const supertype = valueType.getSupertype();
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
      'No visit implementation given for value type assignments. Cannot be the type of a column.',
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
