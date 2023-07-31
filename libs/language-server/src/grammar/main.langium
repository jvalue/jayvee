// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

grammar Jayvee

import './terminal'
import './property'
import './valuetype'
import './constraint'
import './transform'

entry JayveeModel:
  (
    pipelines+=PipelineDefinition
    | valuetypes+=(CustomValuetypeDefinition | BuiltinValuetypeDefinition)
    | constraints+=ConstraintDefinition
    | transforms+=TransformDefinition
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
  'block' name=ID 'oftype' type=BlockTypeLiteral body=PropertyBody;

BlockTypeLiteral:
  name=ID;

PipeDefinition:
  SinglePipeDefinition | ChainedPipeDefinition;

SinglePipeDefinition:
  'pipe' '{'
    'from' ':' from=[BlockDefinition] ';'
    'to' ':' to=[BlockDefinition] ';'
  '}';

ChainedPipeDefinition:
    blocks+=[BlockDefinition] ('->' blocks+=[BlockDefinition])+ ';';
