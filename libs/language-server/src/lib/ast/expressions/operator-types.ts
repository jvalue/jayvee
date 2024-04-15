// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BinaryExpression,
  TernaryExpression,
  UnaryExpression,
} from '../generated/ast';

export type UnaryExpressionOperator = UnaryExpression['operator'];
export type BinaryExpressionOperator = BinaryExpression['operator'];
export type TernaryExpressionOperator = TernaryExpression['operator'];
