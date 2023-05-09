// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AtomicValuetype,
  PrimitiveType,
  PrimitiveValuetype,
  PrimitiveValuetypes,
  Valuetype,
} from '@jvalue/jayvee-language-server';

import { DECIMAL_COMMA_SEPARATOR_REGEX } from './constants';

export class StandardRepresentationResolver {
  constructor(private value: unknown) {}

  fromValuetype(valuetype: Valuetype): PrimitiveType {
    if (valuetype === PrimitiveValuetypes.Boolean) {
      return this.fromBooleanValuetype(valuetype);
    } else if (valuetype === PrimitiveValuetypes.Decimal) {
      return this.fromDecimalValuetype(valuetype);
    } else if (valuetype === PrimitiveValuetypes.Integer) {
      return this.fromIntegerValuetype(valuetype);
    } else if (valuetype === PrimitiveValuetypes.Text) {
      return this.fromTextValuetype(valuetype);
    } else if (valuetype instanceof AtomicValuetype) {
      return this.fromAtomicValuetype(valuetype);
    }
    throw Error('Parsing from unsupported value type');
  }

  fromBooleanValuetype(valuetype: PrimitiveValuetype): boolean {
    assert(valuetype === PrimitiveValuetypes.Boolean);
    if (typeof this.value === 'boolean') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      switch (this.value.toLowerCase()) {
        case 'true':
          return true;
        default:
          return false;
      }
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.getName()}`,
    );
  }

  fromDecimalValuetype(valuetype: PrimitiveValuetype): number {
    assert(valuetype === PrimitiveValuetypes.Decimal);
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      let stringValue: string = this.value;
      if (DECIMAL_COMMA_SEPARATOR_REGEX.test(stringValue)) {
        stringValue = stringValue.replace(',', '.');
      }
      return Number.parseFloat(stringValue);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.getName()}`,
    );
  }

  fromIntegerValuetype(valuetype: PrimitiveValuetype): number {
    assert(valuetype === PrimitiveValuetypes.Integer);
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      return Number.parseInt(this.value, 10);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.getName()}`,
    );
  }

  fromTextValuetype(valuetype: PrimitiveValuetype): string {
    assert(valuetype === PrimitiveValuetypes.Text);
    if (typeof this.value === 'number') {
      return this.value.toString();
    }
    if (typeof this.value === 'string') {
      return this.value;
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.getName()}`,
    );
  }

  fromAtomicValuetype(valuetype: AtomicValuetype): PrimitiveType {
    const supertype = valuetype.getSupertype();
    assert(supertype !== undefined);

    return this.fromValuetype(supertype);
  }
}
