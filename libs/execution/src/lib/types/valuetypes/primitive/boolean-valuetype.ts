// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../visitors/valuetype-visitor';

// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive-valuetype';

export class BooleanValuetype implements PrimitiveValuetype<boolean> {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  constructor(public readonly astNode: PrimitiveValuetypeKeywordLiteral) {
    assert(astNode.keyword === 'boolean');
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitBoolean(this);
  }

  isValid(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(value);
    }

    return false;
  }

  getStandardRepresentation(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      switch (value.toLowerCase()) {
        case 'true':
          return true;
        default:
          return false;
      }
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.astNode.keyword}`,
    );
  }
}
