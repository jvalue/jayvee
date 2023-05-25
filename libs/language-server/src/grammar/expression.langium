// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './cellrange'
import './constraint'
import './valuetype'
import './terminal'
import './transform'

Expression:
  OrExpression;

// The nesting of the following rules implies the precedence of the operators:

OrExpression infers Expression:
  AndExpression ({infer BinaryExpression.left=current} operator='or' right=AndExpression)*;

AndExpression infers Expression:
  XorExpression ({infer BinaryExpression.left=current} operator='and' right=XorExpression)*;

XorExpression infers Expression:
  EqualityExpression ({infer BinaryExpression.left=current} operator='xor' right=EqualityExpression)*;

EqualityExpression infers Expression:
  RelationalExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=RelationalExpression)*;

RelationalExpression infers Expression:
  AdditiveExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=') right=AdditiveExpression)*;

AdditiveExpression infers Expression:
  MultiplicativeExpression ({infer BinaryExpression.left=current} operator=('+' | '-') right=MultiplicativeExpression)*;

MultiplicativeExpression infers Expression:
  ExponentialExpression ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=ExponentialExpression)*;

ExponentialExpression infers Expression:
  PrimaryExpression ({infer BinaryExpression.left=current} operator=('pow' | 'root') right=PrimaryExpression)*;

PrimaryExpression infers Expression:
  '(' Expression ')'
  | UnaryExpression
  | ExpressionLiteral;

UnaryExpression:
  operator=('not' | '+' | '-' | 'sqrt' | 'floor' | 'ceil' | 'round') expression=PrimaryExpression;

ExpressionLiteral:
  ValueLiteral | FreeVariableLiteral;

ValueLiteral:
  TextLiteral
  | NumericLiteral
  | BooleanLiteral
  | RegexLiteral
  | CellRangeLiteral
  | ValuetypeAssignmentLiteral
  | CollectionLiteral;

TextLiteral:
  value=STRING;

NumericLiteral:
  value=(INTEGER | DECIMAL);

BooleanLiteral:
  value?='true' | 'false';

RegexLiteral:
  value=REGEX;

CollectionLiteral:
  '[' (values+=(Expression) (',' values+=(Expression))*)? ','? ']';

FreeVariableLiteral:
  ValueKeywordLiteral | ReferenceLiteral;

ValueKeywordLiteral:
  'value' ('.' lengthAccess?='length')?;

ReferenceLiteral:
  value=[Referencable];

Referencable:
  ConstraintDefinition
  | TransformDefinition
  | TransformPortDefinition;
