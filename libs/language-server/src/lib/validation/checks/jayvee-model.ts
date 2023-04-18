// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { JayveeModel } from '../../ast/generated/ast';
import { checkUniqueNames } from '../validation-util';

export function validateJayveeModel(
  model: JayveeModel,
  accept: ValidationAcceptor,
): void {
  checkUniqueNames(model.pipelines, accept);
}
