// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type DecimalValuetype,
  ERROR_TYPEGUARD,
  type IntegerValuetype,
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  type TextValuetype,
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

// HACK: This is a temporary solution until errors have their own valuetype
// See "Future changes" in RFC0017
function wrap<T extends InternalValidValueRepresentation>(
  f: (value: T) => string,
): (value: T | InternalErrorValueRepresentation) => string {
  return (value: T | InternalErrorValueRepresentation) => {
    if (ERROR_TYPEGUARD(value)) {
      return 'NULL';
    }
    return f(value);
  };
}

export class SQLValueRepresentationVisitor extends ValueTypeVisitor<
  (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string
> {
  override visitBoolean(valueType: BooleanValuetype) {
    return wrap((value: InternalValidValueRepresentation) => {
      assert(valueType.isInternalValidValueRepresentation(value));
      return value ? `'true'` : `'false'`;
    });
  }

  override visitDecimal(valueType: DecimalValuetype) {
    return wrap((value: InternalValidValueRepresentation) => {
      assert(valueType.isInternalValidValueRepresentation(value));
      return value.toString();
    });
  }

  override visitInteger(valueType: IntegerValuetype) {
    return wrap((value: InternalValidValueRepresentation) => {
      assert(valueType.isInternalValidValueRepresentation(value));
      return value.toString();
    });
  }

  override visitText(valueType: TextValuetype) {
    return wrap((value: InternalValidValueRepresentation) => {
      assert(valueType.isInternalValidValueRepresentation(value));
      const escapedValue = escapeSingleQuotes(value);
      return `'${escapedValue}'`;
    });
  }

  override visitAtomicValueType(
    valueType: AtomicValueType,
  ): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    const contained = valueType.getContainedType();
    assert(contained !== undefined);
    return contained.acceptVisitor(this);
  }

  override visitRegex(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for regex. Cannot be the type of a column.',
    );
  }

  override visitCellRange(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for cell ranges. Cannot be the type of a column.',
    );
  }

  override visitConstraint(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for constraints. Cannot be the type of a column.',
    );
  }

  override visitValuetypeAssignment(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for value type assignments. Cannot be the type of a column.',
    );
  }

  override visitCollection(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for collections. Cannot be the type of a column.',
    );
  }

  override visitTransform(): (
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) => string {
    throw new Error(
      'No visit implementation given for transforms. Cannot be the type of a column.',
    );
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
