// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './terminal';
import './expression';

PropertyBody:
  '{' (properties+=PropertyAssignment)* '}';

PropertyAssignment:
  name=ID ':' value=(Expression | RuntimeParameterLiteral) ';';

RuntimeParameterLiteral:
  'requires' name=ID;
