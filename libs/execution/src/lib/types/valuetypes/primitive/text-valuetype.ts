// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../visitors/valuetype-visitor';

// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive-valuetype';

export class TextValuetype implements PrimitiveValuetype<string> {
  constructor(public readonly astNode: PrimitiveValuetypeKeywordLiteral) {
    assert(astNode.keyword === 'text');
  }

  isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitText(this);
  }

  getStandardRepresentation(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.astNode.keyword}`,
    );
  }
}
