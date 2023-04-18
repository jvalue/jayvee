// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../visitors/valuetype-visitor';

import { PrimitiveValuetype } from './primitive-valuetype';

export class IntegerValuetype implements PrimitiveValuetype<number> {
  constructor(public readonly astNode: PrimitiveValuetypeKeywordLiteral) {
    assert(astNode.keyword === 'integer');
  }

  isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return /^[+-]?[0-9]+$/.test(value);
    }

    return Number.isInteger(value);
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitInteger(this);
  }

  getStandardRepresentation(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number.parseInt(value, 10);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.astNode.keyword}`,
    );
  }
}
