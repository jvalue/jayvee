// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

grammar Jayvee

import './blocktype'
import './terminal'
import './property'
import './valuetype'
import './constraint'
import './transform'
import './iotype'

entry JayveeModel:
  (
    pipelines+=PipelineDefinition
    | valuetypes+=(CustomValuetypeDefinition | BuiltinValuetypeDefinition)
    | constraints+=ConstraintDefinition
    | transforms+=TransformDefinition
    | blocktypes+=ReferenceableBlocktypeDefinition
    | constrainttypes+=BuiltinConstrainttypeDefinition
    | iotypes+=IotypeDefinition
  )*;

PipelineDefinition:
  'pipeline' name=ID '{'
    (
      blocks+=BlockDefinition
      | pipes+=PipeDefinition
      | valuetypes+=CustomValuetypeDefinition
      | constraints+=ConstraintDefinition
      | transforms+=TransformDefinition
    )*
  '}';

BlockDefinition:
  'block' name=ID 'oftype' type=[ReferenceableBlocktypeDefinition] body=PropertyBody;

PipeDefinition:
  SinglePipeDefinition | ChainedPipeDefinition;

SinglePipeDefinition:
  'pipe' '{'
    'from' ':' from=[BlockDefinition] ';'
    'to' ':' to=[BlockDefinition] ';'
  '}';

ChainedPipeDefinition:
    blocks+=[BlockDefinition] ('->' blocks+=[BlockDefinition])+ ';';
