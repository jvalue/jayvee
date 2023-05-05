// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'
import 'valuetype'
import 'expression'

TransformDefinition:
  'transform' name=ID body=TransformBody;

TransformBody:
  '{' (ports+=TransformPortDefinition)* (outputAssignments+=TransformOutputAssignment)* '}';

TransformPortDefinition:
  kind=('from' | 'to') name=ID 'oftype' valueType=(PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference) ';'; 
 
TransformOutputAssignment:
  outPortName=[TransformPortDefinition] ':' expression=Expression ';';
