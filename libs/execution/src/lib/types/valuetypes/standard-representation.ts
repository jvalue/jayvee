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
  Valuetype,
} from '@jvalue/jayvee-language-server';

export class StandardRepresentationResolver {
  private readonly DECIMAL_COMMA_SEPARATOR_REGEX = /^[+-]?([0-9]*[,])?[0-9]+$/;

  constructor(private value: unknown) {}

  fromValuetype(valuetype: Valuetype): PrimitiveType {
    if (valuetype instanceof BooleanValuetype) {
      return this.fromBooleanValuetype(valuetype);
    } else if (valuetype instanceof DecimalValuetype) {
      return this.fromDecimalValuetype(valuetype);
    } else if (valuetype instanceof IntegerValuetype) {
      return this.fromIntegerValuetype(valuetype);
    } else if (valuetype instanceof TextValuetype) {
      return this.fromTextValuetype(valuetype);
    } else if (valuetype instanceof AtomicValuetype) {
      return this.fromAtomicValuetype(valuetype);
    }
    throw Error('Parsing from unsupported value type');
  }

  fromBooleanValuetype(valuetype: BooleanValuetype): boolean {
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
      `Invalid value: ${this.value} for type ${valuetype.astNode.keyword}`,
    );
  }

  fromDecimalValuetype(valuetype: DecimalValuetype): number {
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      let stringValue: string = this.value;
      if (this.DECIMAL_COMMA_SEPARATOR_REGEX.test(stringValue)) {
        stringValue = stringValue.replace(',', '.');
      }
      return Number.parseFloat(stringValue);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.astNode.keyword}`,
    );
  }

  fromIntegerValuetype(valuetype: IntegerValuetype): number {
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      return Number.parseInt(this.value, 10);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.astNode.keyword}`,
    );
  }

  fromTextValuetype(valuetype: TextValuetype): string {
    if (typeof this.value === 'number') {
      return this.value.toString();
    }
    if (typeof this.value === 'string') {
      return this.value;
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${this.value} for type ${valuetype.astNode.keyword}`,
    );
  }

  fromAtomicValuetype(valuetype: AtomicValuetype): PrimitiveType {
    return this.fromValuetype(valuetype.primitiveValuetype);
  }
}
