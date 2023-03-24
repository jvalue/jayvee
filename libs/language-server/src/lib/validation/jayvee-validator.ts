// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationChecks } from 'langium';

import type { JayveeAstType } from '../ast/generated/ast';

export interface JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType>;
}
