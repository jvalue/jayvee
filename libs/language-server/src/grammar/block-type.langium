// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './io-type'
import './terminal'
import './transform'
import './value-type'
import './block'
import './main'

ReferenceableBlockTypeDefinition:
  BuiltinBlockTypeDefinition | CompositeBlockTypeDefinition;

BuiltinBlockTypeDefinition:
    'builtin' 'blocktype' name=ID '{'
        (inputs+=BlockTypeInput | outputs+=BlockTypeOutput | properties+=BlockTypeProperty)*
'}';

CompositeBlockTypeDefinition:
    'composite' 'blocktype' name=ID '{'
        (
            inputs+=BlockTypeInput
            | outputs+=BlockTypeOutput
            | properties+=BlockTypeProperty
            | blocks+=BlockDefinition
            | pipes+=BlockTypePipeline
            | transforms+=TransformDefinition
        )*
'}';

BlockTypeInput:
    'input' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlockTypeOutput:
    'output' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlockTypeProperty:
    'property' name=ID 'oftype' valueType=ValueTypeReference (':' defaultValue=Expression)? ';';

BlockTypePipeline:
    input=[BlockTypeInput] '->' (blocks+=[BlockDefinition] '->')+ output=[BlockTypeOutput] ';';