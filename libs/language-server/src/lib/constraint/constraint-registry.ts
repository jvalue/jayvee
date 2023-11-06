// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ConstraintMetaInformation } from '../meta-information';
import { registerConstraintMetaInf } from '../meta-information/meta-inf-registry';
import { ConstructorClass } from '../util';

import { AllowlistConstraintMetaInformation } from './allowlist-constraint-meta-inf';
import { DenylistConstraintMetaInformation } from './denylist-constraint-meta-inf';
import { LengthConstraintMetaInformation } from './length-constraint-meta-inf';
import { RangeConstraintMetaInformation } from './range-constraint-meta-inf';
import { RegexConstraintMetaInformation } from './regex-constraint-meta-inf';

export function getAvailableConstraintMetaInf(): ConstructorClass<ConstraintMetaInformation>[] {
  return [
    AllowlistConstraintMetaInformation,
    DenylistConstraintMetaInformation,
    RegexConstraintMetaInformation,
    LengthConstraintMetaInformation,
    RangeConstraintMetaInformation,
  ];
}

export function registerConstraints() {
  for (const metaInf of getAvailableConstraintMetaInf()) {
    registerConstraintMetaInf(metaInf);
  }
}
