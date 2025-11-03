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
  IfExpression;

// The nesting of the following rules implies the precedence of the operators:
IfExpression infers Expression:
  ReplaceExpression ({infer TernaryExpression.first=current} operator='if'
  second=ReplaceExpression 'else' third=ReplaceExpression)*;

// The nesting of the following rules implies the precedence of the operators:
ReplaceExpression infers Expression:
  BinaryExpression ({infer TernaryExpression.first=current} operator='replace'
  second=BinaryExpression 'with' third=BinaryExpression)*;

infix BinaryExpression on PrimaryExpression:
  'pow' | 'root' // Higher precedence
  > '*' | '/' | '%'
  > '+' | '-'
  > '<' | '<=' | '>' | '>='
  > 'in'
  > 'matches'
  > '==' | '!='
  > 'xor'
  > 'and'
  > 'or';

PrimaryExpression infers Expression:
  '(' Expression ')'
  | UnaryExpression
  | ExpressionLiteral;

UnaryExpression:
  operator=('not' | '+' | '-' | 'sqrt' | 'floor' | 'ceil' | 'round' | 'lowercase' | 'uppercase' | 'asDecimal' | 'asInteger' | 'asBoolean' | 'asText' | 'lengthof') expression=PrimaryExpression;

ExpressionLiteral:
  ValueLiteral | FreeVariableLiteral;

ValueLiteral:
  TextLiteral
  | NumericLiteral
  | BooleanLiteral
  | RegexLiteral
  | CellRangeLiteral
  | ValuetypeAssignmentLiteral
  | CollectionLiteral
  | ErrorLiteral;

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

ErrorLiteral:
  error= "invalid" | "missing";

FreeVariableLiteral:
  ValueKeywordLiteral | ReferenceLiteral | NestedPropertyAccess ;

ValueKeywordLiteral:
  value='value';

ReferenceLiteral:
  value=[Referencable];

Referencable:
  ConstraintDefinition
  | BlockTypeProperty
  | TransformDefinition
  | TransformPortDefinition
  | ValueTypeProperty;

NestedPropertyAccess:
  value=[ValueTypeProperty] ('.' nestedAccesses+=ID)+;
