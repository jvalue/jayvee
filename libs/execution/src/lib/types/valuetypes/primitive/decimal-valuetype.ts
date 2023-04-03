// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../visitors/valuetype-visitor';

// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive-valuetype';

export class DecimalValuetype implements PrimitiveValuetype<number> {
  private readonly DOT_SEPARATOR_REGEX = /^[+-]?([0-9]*[.])?[0-9]+$/;
  private readonly COMMA_SEPARATOR_REGEX = /^[+-]?([0-9]*[,])?[0-9]+$/;

  constructor(public readonly astNode: PrimitiveValuetypeKeywordLiteral) {
    assert(astNode.keyword === 'decimal');
  }

  isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return (
        this.DOT_SEPARATOR_REGEX.test(value) ||
        this.COMMA_SEPARATOR_REGEX.test(value)
      );
    }

    return !Number.isNaN(value);
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitDecimal(this);
  }

  getStandardRepresentation(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      let stringValue: string = value;
      if (this.COMMA_SEPARATOR_REGEX.test(stringValue)) {
        stringValue = stringValue.replace(',', '.');
      }
      return Number.parseFloat(stringValue);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.astNode.keyword}`,
    );
  }
}
