// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'
import 'value-type'
import 'expression'

TransformDefinition:
  'transform' name=ID body=TransformBody;

TransformBody:
  '{' (ports+=TransformPortDefinition)* (outputAssignments+=TransformOutputAssignment)* '}';

TransformPortDefinition:
  kind=('from' | 'to') name=ID 'oftype' valueType=ValueTypeReference ';'; 
 
TransformOutputAssignment:
  outPortName=[TransformPortDefinition] ':' expression=Expression ';';
