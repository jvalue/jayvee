// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './block'
import './transform'
import './value-type'
import './constraint'
import './terminal'

PipelineDefinition:
  'pipeline' name=ID '{'
    (
      blocks+=BlockDefinition
      | pipes+=PipeDefinition
      | valueTypes+=CustomValuetypeDefinition
      | constraints+=ConstraintDefinition
      | transforms+=TransformDefinition
    )*
  '}';

PipeDefinition:
    blocks+=[BlockDefinition] ('->' blocks+=[BlockDefinition])+ ';';