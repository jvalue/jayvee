// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { TypedConstraintDefinition } from '../../ast/generated/ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';

export function validateTypedConstraintDefinition(
  constraint: TypedConstraintDefinition,
  context: ValidationContext,
): void {
  checkConstraintType(constraint, context);
}

function checkConstraintType(
  constraint: TypedConstraintDefinition,
  context: ValidationContext,
): void {
  const constraintType = constraint?.type;
  if (constraintType === undefined) {
    return undefined;
  }

  const metaInf = getMetaInformation(constraintType);
  if (metaInf === undefined) {
    context.accept(
      'error',
      `Unknown constraint type '${constraintType.name ?? ''}'`,
      {
        node: constraint,
        property: 'type',
      },
    );
  }
}
