// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './block'
import './transform'
import './valuetype'
import './constraint'
import './terminal'

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

PipeDefinition:
  SinglePipeDefinition | ChainedPipeDefinition;

SinglePipeDefinition:
  'pipe' '{'
    'from' ':' from=[BlockDefinition] ';'
    'to' ':' to=[BlockDefinition] ';'
  '}';

ChainedPipeDefinition:
    blocks+=[BlockDefinition] ('->' blocks+=[BlockDefinition])+ ';';