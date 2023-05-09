// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './property'
import './terminal'

ConstraintDefinition:
  'constraint' name=ID 'oftype' type=ConstraintTypeLiteral body=PropertyBody;

ConstraintTypeLiteral:
  name=ID;

ConstraintReferenceLiteral:
  value=[ConstraintDefinition];
