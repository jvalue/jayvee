// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './expression'
import './iotype'
import './terminal'
import './valuetype'

BuiltinBlocktypeDefinition:
    'builtin' 'blocktype' name=ID '{'
        (inputs+=BlocktypeInput | outputs+=BlocktypeOutput | properties+=BlocktypeProperty)*
'}';

BlocktypeInput:
    'input' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlocktypeOutput:
    'output' name=ID 'oftype' iotype=[IotypeDefinition] ';';

BlocktypeProperty:
    'property' name=ID 'oftype' valuetype=ValuetypeReference (':' defaultValue=Expression)? ';';