// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  PrimitiveType,
  PrimitiveValuetypes,
  Valuetype,
} from '@jvalue/jayvee-language-server';

import { DECIMAL_COMMA_SEPARATOR_REGEX } from './constants';

export class StandardRepresentationResolver {
  constructor(private value: unknown) {}

  fromValuetype(valuetype: Valuetype): PrimitiveType {
    if (valuetype === PrimitiveValuetypes.Boolean) {
      return this.fromBooleanValuetype();
    } else if (valuetype === PrimitiveValuetypes.Decimal) {
      return this.fromDecimalValuetype();
    } else if (valuetype === PrimitiveValuetypes.Integer) {
      return this.fromIntegerValuetype();
    } else if (valuetype === PrimitiveValuetypes.Text) {
      return this.fromTextValuetype();
    } else if (valuetype instanceof AtomicValuetype) {
      return this.fromAtomicValuetype(valuetype);
    }
    throw Error('Parsing from unsupported value type');
  }

  fromBooleanValuetype(): boolean {
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
      `Invalid value: ${this.value} for type boolean`,
    );
  }

  fromDecimalValuetype(): number {
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
      `Invalid value: ${this.value} for type decimal`,
    );
  }

  fromIntegerValuetype(): number {
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      return Number.parseInt(this.value, 10);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type integer`,
    );
  }

  fromTextValuetype(): string {
    if (typeof this.value === 'number') {
      return this.value.toString();
    }
    if (typeof this.value === 'string') {
      return this.value;
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type text`,
    );
  }

  fromAtomicValuetype(valuetype: AtomicValuetype): PrimitiveType {
    const supertype = valuetype.getSupertype();
    if (supertype === undefined) {
      throw new Error(
        `Valuetype ${valuetype.astNode.name} has no transitive primitive supertype!`,
      );
    }
    return this.fromValuetype(supertype);
  }
}
