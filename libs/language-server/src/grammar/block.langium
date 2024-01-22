// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './property'
import './blocktype'
import './terminal'

BlockDefinition:
  'block' name=ID 'oftype' type=[ReferenceableBlocktypeDefinition] body=PropertyBody;