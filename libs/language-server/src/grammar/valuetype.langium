// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'property'
import 'terminal'

ValuetypeDefinition:
  'valuetype' name=ID 'oftype' type=PrimitiveValuetypeKeyword '{'
    'constraints' ':' constraints=CollectionLiteral ';'
  '}';

ValuetypeAssignmentLiteral:
  value=ValuetypeAssignment;

ValuetypeAssignment:
  name=STRING 'oftype' type=(PrimitiveValuetypeKeyword | ValuetypeDefinitionReference);

// Workaround as cross-references cannot be mixed with other types
ValuetypeDefinitionReference:
  reference=[ValuetypeDefinition];

PrimitiveValuetypeKeyword returns string:
  'text'
  | 'decimal'
  | 'integer'
  | 'boolean';
