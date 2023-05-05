// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstNodeWrapper,
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';
import { VisitableValuetype } from './visitors/visitable-valuetype';

export type ValuetypeAstNode =
  | PrimitiveValuetypeKeywordLiteral
  | ValuetypeDefinition;

export interface Valuetype<
  N extends ValuetypeAstNode = ValuetypeAstNode,
  T = unknown,
> extends VisitableValuetype,
    AstNodeWrapper<N> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;

  getStandardRepresentation(value: unknown): T;
}
