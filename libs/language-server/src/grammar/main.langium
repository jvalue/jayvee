// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

grammar Jayvee

import './blocktype'
import './pipeline'
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


