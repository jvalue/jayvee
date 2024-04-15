// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

grammar Jayvee

import './block-type'
import './pipeline'
import './terminal'
import './property'
import './value-type'
import './constraint'
import './transform'
import './io-type'

entry JayveeModel:
  (
    pipelines+=PipelineDefinition
    | valueTypes+=(CustomValuetypeDefinition | BuiltinValuetypeDefinition)
    | constraints+=ConstraintDefinition
    | transforms+=TransformDefinition
    | blockTypes+=ReferenceableBlockTypeDefinition
    | constrainttypes+=BuiltinConstrainttypeDefinition
    | iotypes+=IotypeDefinition
  )*;


