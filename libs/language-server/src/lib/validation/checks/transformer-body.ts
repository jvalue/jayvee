// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TransformerBody } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validateTransformerBody(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  checkUniqueNames(transformerBody.ports, context, 'transformer port');
}
