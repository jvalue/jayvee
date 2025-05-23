// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './terminal'
import './value-type'
import './expression'

ConstraintDefinition:
  'constraint' name=ID 'on' valueType=ValueTypeReference ':' expression=Expression ';';

