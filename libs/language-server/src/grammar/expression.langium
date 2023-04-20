// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'

Expression:
  OrExpression;

// The nesting of the following rules implies the precedence of the operators:

OrExpression infers Expression:
  AndExpression ({infer BinaryExpression.left=current} operator='or' right=AndExpression)*;

AndExpression infers Expression:
  XorExpression ({infer BinaryExpression.left=current} operator='and' right=XorExpression)*;

XorExpression infers Expression:
  RelationalExpression ({infer BinaryExpression.left=current} operator='xor' right=RelationalExpression)*;

RelationalExpression infers Expression:
  EqualityExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=') right=EqualityExpression)*;

EqualityExpression infers Expression:
  PrimaryExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=PrimaryExpression)*;

PrimaryExpression infers Expression:
  '(' Expression ')'
  | UnaryExpression
  | ExpressionLiteral;

UnaryExpression:
  operator='not' expression=PrimaryExpression;

ExpressionLiteral:
  TextLiteral
  | NumericLiteral
  | BooleanLiteral;

TextLiteral:
  value=STRING;

NumericLiteral:
  value=(INTEGER | SIGNED_INTEGER | DECIMAL | SIGNED_DECIMAL);

BooleanLiteral:
  value?='true' | 'false';
