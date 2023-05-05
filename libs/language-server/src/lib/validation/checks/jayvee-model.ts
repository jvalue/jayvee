// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { JayveeModel } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validateJayveeModel(
  model: JayveeModel,
  context: ValidationContext,
): void {
  checkUniqueNames(model.pipelines, context);
  checkUniqueNames(model.transforms, context);
  checkUniqueNames(model.valuetypes, context);
  checkUniqueNames(model.constraints, context);
}
