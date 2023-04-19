// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { ConstraintDefinition } from '../../ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';

export function validateConstraintDefinition(
  constraint: ConstraintDefinition,
  context: ValidationContext,
): void {
  checkConstraintType(constraint, context);
}

function checkConstraintType(
  constraint: ConstraintDefinition,
  context: ValidationContext,
): void {
  const metaInf = getMetaInformation(constraint.type);
  if (metaInf === undefined) {
    context.accept(
      'error',
      `Unknown constraint type '${constraint.type.name ?? ''}'`,
      {
        node: constraint,
        property: 'type',
      },
    );
  }
}
