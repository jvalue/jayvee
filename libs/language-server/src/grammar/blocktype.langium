// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './terminal'
import './valuetype'

BuiltinBlocktypeDefinition:
    'builtin' 'blocktype' name=ID '{'
        (inputs+=BlocktypeInput | outputs+=BlocktypeOutput | properties+=BlocktypeProperty)*
'}';

BlocktypeInput:
    'input' name=ID 'oftype' iotype=[ValuetypeDefinition] ';';

BlocktypeOutput:
    'output' name=ID 'oftype' iotype=[ValuetypeDefinition] ';';

BlocktypeProperty:
    'property' name=ID 'oftype' valuetype=[ValuetypeDefinition] (':' defaultValue=Expression)? ';';