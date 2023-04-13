// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'

BooleanExpression:
  OrExpression;

// The nesting of the following rules implies the precedence of the operators:

OrExpression infers BooleanExpression:
  AndExpression ({infer BinaryExpression.left=current} operator='or' right=AndExpression)*;

AndExpression infers BooleanExpression:
  XorExpression ({infer BinaryExpression.left=current} operator='and' right=XorExpression)*;

XorExpression infers BooleanExpression:
  EqualityExpression ({infer BinaryExpression.left=current} operator='xor' right=EqualityExpression)*;

EqualityExpression infers BooleanExpression:
  PrimaryExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=PrimaryExpression)*;

PrimaryExpression infers BooleanExpression:
  '(' BooleanExpression ')'
  | UnaryExpression
  | BooleanLiteral;

UnaryExpression:
  operator='!' expression=PrimaryExpression;

BooleanLiteral:
  value?='true' | 'false';
