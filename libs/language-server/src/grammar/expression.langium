// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './block-type'
import './cell-range'
import './constraint'
import './value-type'
import './terminal'
import './transform'

Expression:
  ReplaceExpression;

// The nesting of the following rules implies the precedence of the operators:

ReplaceExpression infers Expression:
  OrExpression ({infer TernaryExpression.first=current} operator='replace' second=OrExpression 'with' third=OrExpression)*;

OrExpression infers Expression:
  AndExpression ({infer BinaryExpression.left=current} operator='or' right=AndExpression)*;

AndExpression infers Expression:
  XorExpression ({infer BinaryExpression.left=current} operator='and' right=XorExpression)*;

XorExpression infers Expression:
  EqualityExpression ({infer BinaryExpression.left=current} operator='xor' right=EqualityExpression)*;

EqualityExpression infers Expression:
  MatchesExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=MatchesExpression)*;

MatchesExpression infers Expression:
  InExpression ({infer BinaryExpression.left=current} operator='matches' right=InExpression)*;

InExpression infers Expression:
  RelationalExpression ({infer BinaryExpression.left=current} operator='in' right=RelationalExpression)*;

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
  operator=('not' | '+' | '-' | 'sqrt' | 'floor' | 'ceil' | 'round' | 'lowercase' | 'uppercase') expression=PrimaryExpression;

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
  value=(INTEGER)
  | value=(DECIMAL);

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
  | BlockTypeProperty
  | TransformDefinition
  | TransformPortDefinition;
