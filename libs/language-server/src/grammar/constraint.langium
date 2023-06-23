// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './property'
import './terminal'
import './valuetype'
import './expression'

ConstraintDefinition:
  TypedConstraintDefinition | ExpressionConstraintDefinition;

TypedConstraintDefinition:
  'constraint' name=ID 'oftype' type=ConstraintTypeLiteral body=PropertyBody;

ExpressionConstraintDefinition:
  'constraint' name=ID 'on' valuetype=ValuetypeReference ':' expression=Expression ';';


ConstraintTypeLiteral:
  name=ID;

