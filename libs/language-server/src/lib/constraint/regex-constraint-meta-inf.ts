// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypes } from '../ast';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RegexConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RegexConstraint',
      {
        regex: {
          type: PrimitiveValuetypes.Regex,
        },
      },
      ['text'],
    );
    super.docs = {
      description:
        'Limits the values complying with a regex. Only values that comply with the regex are considered valid.',
      examples: [
        {
          description:
            'Text that complies with the IFOPT (Identification of Fixed Objects in Public Transport) DIN EN 28701:2012 format.',
          code: `constraint IFOPT_Format oftype RegexConstraint {
  regex: /[a-z]{2}:\\d+:\\d+(:\\d+)?(:\\d+)?/;
}`,
        },
      ],
    };
  }
}
