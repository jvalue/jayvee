// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './terminal'

BuiltinValuetypeDefinition infers ValuetypeDefinition:
  isBuiltin?='builtin' 'valuetype' name=ID 
    (isGeneric?='<' 
      genericNames+=ID 
      (',' generics+=ID)* 
    '>')? 
  ';';

CustomValuetypeDefinition infers ValuetypeDefinition:
  'valuetype' name=ID 'oftype' type=ValuetypeReference '{'
    'constraints' ':' constraints=CollectionLiteral ';'
  '}';

ValuetypeAssignmentLiteral:
  value=ValuetypeAssignment;

ValuetypeAssignment:
  name=STRING 'oftype' type=ValuetypeReference;

ValuetypeReference:
  reference=[ValuetypeDefinition] 
    (isGenericRef='<' 
      genericRefs+=[ValuetypeDefinition] (',' genericRefs+=[ValuetypeDefinition])* 
    '>')?;

