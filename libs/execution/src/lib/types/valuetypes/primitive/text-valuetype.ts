// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../visitors/valuetype-visitor';

import { PrimitiveValuetype } from './primitive-valuetype';

export class TextValuetype implements PrimitiveValuetype {
  constructor(public readonly astNode: PrimitiveValuetypeKeywordLiteral) {
    assert(astNode.keyword === 'text');
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitText(this);
  }
}
