// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal';
import 'valuetype';
import 'cellrange';
import 'constraint';
import 'expression';

PropertyBody:
  '{' (properties+=PropertyAssignment)* '}';

PropertyAssignment:
  name=ID ':' value=(PropertyValueLiteral | RuntimeParameterLiteral) ';';

RuntimeParameterLiteral:
  'requires' name=ID;

PropertyValueLiteral:
  AtomicLiteral | CollectionLiteral;

AtomicLiteral:
  TextLiteral
  | NumericLiteral
  | BooleanExpression
  | RegexLiteral
  | CellRangeLiteral
  | ValuetypeAssignmentLiteral
  | ConstraintReferenceLiteral;

TextLiteral:
  value=STRING;

NumericLiteral:
  value=(INTEGER | NUMBER);

CollectionLiteral:
  '[' (values+=(AtomicLiteral) (',' values+=(AtomicLiteral))*)? ','? ']';

RegexLiteral:
  value=REGEX;
