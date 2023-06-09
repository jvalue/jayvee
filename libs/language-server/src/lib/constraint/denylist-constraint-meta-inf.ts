// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  PrimitiveValuetypes,
} from '../ast/wrappers/value-type';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class DenylistConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'DenylistConstraint',
      {
        denylist: {
          type: new CollectionValuetype(PrimitiveValuetypes.Text),
        },
      },
      PrimitiveValuetypes.Text,
    );
    super.docs = {
      description:
        'Defines a set of forbidden values. All values in the list are considered invalid.',
      examples: [
        {
          code: `constraint NoPrimaryColors oftype DenylistConstraint {
  denylist: ["red", "blue", "yellow"];
}`,
          description: 'Denies all primary colors.',
        },
      ],
    };
  }
}
