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
  'constraint' name=ID 'oftype' type=[BuiltinConstrainttypeDefinition] body=PropertyBody;

ExpressionConstraintDefinition:
  'constraint' name=ID 'on' valuetype=ValuetypeReference ':' expression=Expression ';';

BuiltinConstrainttypeDefinition:
  'builtin' 'constrainttype' name=ID '{'
    (properties+=ConstrainttypeProperty)*
'}';

ConstrainttypeProperty:
    'property' name=ID 'oftype' valueType=ValuetypeReference (':' defaultValue=Expression)? ';';