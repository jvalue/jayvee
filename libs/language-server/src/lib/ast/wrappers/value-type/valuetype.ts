// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';
import { VisitableValuetype } from './visitors/visitable-valuetype';

export type ValuetypeAstNode =
  | PrimitiveValuetypeKeywordLiteral
  | ValuetypeDefinition;

export interface Valuetype<N extends ValuetypeAstNode = ValuetypeAstNode>
  extends VisitableValuetype,
    AstNodeWrapper<N> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;
}
