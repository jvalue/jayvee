// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
// eslint-disable-next-line import/no-cycle
import {
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  TextValuetype,
} from './primitive';

export type ValuetypeAstNode =
  | PrimitiveValuetypeKeywordLiteral
  | ValuetypeDefinition;

export interface VisitableValuetype {
  acceptVisitor(visitor: ValuetypeVisitor): void;
}

export interface Valuetype<N extends ValuetypeAstNode = ValuetypeAstNode>
  extends VisitableValuetype,
    AstNodeWrapper<N> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;
}

export abstract class ValuetypeVisitor<R = unknown> {
  abstract visitBoolean(valuetype: BooleanValuetype): R;
  abstract visitDecimal(valuetype: DecimalValuetype): R;
  abstract visitInteger(valuetype: IntegerValuetype): R;
  abstract visitText(valuetype: TextValuetype): R;
  abstract visitAtomicValuetype(valuetype: AtomicValuetype): R;
}
