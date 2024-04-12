// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './property'
import './block-type'
import './terminal'

BlockDefinition:
  'block' name=ID 'oftype' type=[ReferenceableBlockTypeDefinition] body=PropertyBody;