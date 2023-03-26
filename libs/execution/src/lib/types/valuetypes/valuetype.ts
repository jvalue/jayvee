// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstNodeWrapper,
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '@jvalue/language-server';

import { ExecutionContext } from '../../execution-context';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';
// eslint-disable-next-line import/no-cycle
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

  isValid(value: unknown, context: ExecutionContext): boolean;

  getStandardRepresentation(value: unknown): T;
}
