// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './property'
import './terminal'
import './value-type'
import './expression'

ConstraintDefinition:
  TypedConstraintDefinition | ExpressionConstraintDefinition;

TypedConstraintDefinition:
  (isPublished?='publish')? 'constraint' name=ID 'oftype' type=[BuiltinConstrainttypeDefinition] body=PropertyBody;

ExpressionConstraintDefinition:
  (isPublished?='publish')? 'constraint' name=ID 'on' valueType=ValueTypeReference ':' expression=Expression ';';

BuiltinConstrainttypeDefinition:
  (isPublished?='publish')? 'builtin' 'constrainttype' name=ID 'on' valueType=ValueTypeReference '{'
    (properties+=ConstrainttypeProperty)*
'}';

ConstrainttypeProperty:
    'property' name=ID 'oftype' valueType=ValueTypeReference (':' defaultValue=Expression)? ';';