// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyValuetype } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RegexConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RegexConstraint',
      {
        regex: {
          type: PropertyValuetype.REGEX,
        },
      },
      ['text'],
    );
  }
}
