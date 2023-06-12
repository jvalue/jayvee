// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  PrimitiveValuetypes,
} from '../ast/wrappers/value-type';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class AllowlistConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'AllowlistConstraint',
      {
        allowlist: {
          type: new CollectionValuetype(PrimitiveValuetypes.Text),
        },
      },
      PrimitiveValuetypes.Text,
    );
    super.docs = {
      description:
        'Limits the values to a defined a set of allowed values. Only values in the list are valid.',
      examples: [
        {
          code: `constraint TimeUnitString oftype AllowlistConstraint {
  allowlist: ["ms", "s", "min", "h", "d", "m", "y"];
}`,
          description:
            'Only allows the common abbreviations for millisecond, second, minute, etc..',
        },
      ],
    };
  }
}
