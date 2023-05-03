// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'
import 'valuetype'
import 'expression'

TransformerDefinition:
  'transformer' name=ID body=TransformerBody;

TransformerBody:
  '{' (ports+=TransformerPortDefinition)* (outputAssignments+=TransformerOutputAssignment)* '}';

TransformerPortDefinition:
  kind=('from' | 'to') name=ID 'oftype' valueType=(PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference) ';'; 
 
TransformerOutputAssignment:
  outPortName=[TransformerPortDefinition] ':' expression=Expression ';';
