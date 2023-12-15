// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './iotype'
import './terminal'
import './transform'
import './valuetype'
import './block'
import './main'

ReferenceableBlocktypeDefinition:
  BuiltinBlocktypeDefinition | CompositeBlocktypeDefinition;

BuiltinBlocktypeDefinition:
    'builtin' 'blocktype' name=ID '{'
        (inputs+=BlocktypeInput | outputs+=BlocktypeOutput | properties+=BlocktypeProperty)*
'}';

CompositeBlocktypeDefinition:
    'composite' 'blocktype' name=ID '{'
        (
            inputs+=BlocktypeInput
            | outputs+=BlocktypeOutput
            | properties+=BlocktypeProperty
            | blocks+=BlockDefinition
            | pipes+=BlocktypePipeline
            | transforms+=TransformDefinition
        )*
'}';

BlocktypeInput:
    'input' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlocktypeOutput:
    'output' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlocktypeProperty:
    'property' name=ID 'oftype' valueType=ValuetypeReference (':' defaultValue=Expression)? ';';

BlocktypePipeline:
    input=[BlocktypeInput] '->' (blocks+=[BlockDefinition] '->')+ output=[BlocktypeOutput] ';';