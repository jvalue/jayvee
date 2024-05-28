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
    | exportableElements+=ExportableElementDefinition
    | pipelines+=PipelineDefinition
  )*;

ExportableElementDefinition:
  (isPublished?='publish')? ExportableElement;

ExportableElement: 
  (CustomValuetypeDefinition | BuiltinValuetypeDefinition)
    | ConstraintDefinition
    | TransformDefinition
    | ReferenceableBlockTypeDefinition
    | BuiltinConstrainttypeDefinition
    | IotypeDefinition;

ExportDefinition:
  'publish' element=[ExportableElement] ('as' alias=ID)? ';';

ImportDefinition:
  'use' (
    useAll?='*' 
    | '{' usedElements+=NamedImportElement (',' usedElements+=NamedImportElement)* '}'
  ) 'from' path=STRING ';';

NamedImportElement:
  element=ID ('as' alias=ID)?;