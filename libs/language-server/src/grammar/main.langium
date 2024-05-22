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
    imports+=ImportDefinition
    | exports+=ExportDefinition
    | pipelines+=PipelineDefinition
    | valueTypes+=(CustomValuetypeDefinition | BuiltinValuetypeDefinition)
    | constraints+=ConstraintDefinition
    | transforms+=TransformDefinition
    | blockTypes+=ReferenceableBlockTypeDefinition
    | constrainttypes+=BuiltinConstrainttypeDefinition
    | iotypes+=IotypeDefinition
  )*;

// When adding an element here, make sure the element has the following prependix in its rule
// (isPublished?='publish')?
// TypeScript lets us then infer that there is a field `isPublished` after using the type guard `isExportableElement`.
ExportableElement:
  // Must ref rules where isPublished is defined 
  // So don't use aggregates like ReferenceableBlockTypeDefinition
  // Otherwise it doesn't work to resolve the refenerces
  (CustomValuetypeDefinition | BuiltinValuetypeDefinition)
  | (TypedConstraintDefinition | ExpressionConstraintDefinition | BuiltinConstrainttypeDefinition)
  | TransformDefinition
  | (BuiltinBlockTypeDefinition | CompositeBlockTypeDefinition) 
  | IotypeDefinition;

ExportDefinition:
  'publish' element=[ExportableElement] ';';

ImportDefinition:
  'use' '*' 'from' path=STRING ';';
