// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './terminal'

BuiltinValuetypeDefinition infers ValuetypeDefinition:
  isBuiltin?='builtin' 'valuetype' name=ID 
    (genericDefinition=ValuetypeGenericsDefinition)?
  ';';

CustomValuetypeDefinition infers ValuetypeDefinition:
  'valuetype' name=ID 
    (genericDefinition=ValuetypeGenericsDefinition)?
  '{'
    attribute=ValueTypeAttribute
    (constraints+=ValueTypeConstraintReference)*
  '}';

ValueTypeAttribute:
  'property' name=ID 'oftype' type=ValueTypeReference ';';

ValueTypeConstraintReference:
  'constraint' name=ID ':' definition=[ConstraintDefinition] 'on' attribute=[ValueTypeAttribute] ';';

ValuetypeAssignmentLiteral:
  value=ValuetypeAssignment;

ValuetypeAssignment:
  name=STRING 'oftype' type=ValueTypeReference;

ValueTypeReference:
  reference=[ValuetypeDefinition] 
    ('<' 
      genericRefs+=[ValuetypeDefinition] (',' genericRefs+=[ValuetypeDefinition])* 
    '>')?;

ValuetypeGenericsDefinition:
  '<' 
    generics+=ValuetypeGenericDefinition
    (',' generics+=ValuetypeGenericDefinition)* 
  '>';

ValuetypeGenericDefinition:
  name=ID;
