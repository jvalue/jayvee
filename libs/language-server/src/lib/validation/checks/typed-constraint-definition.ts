/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { TypedConstraintDefinition } from '../../ast/generated/ast';
import { ConstraintWrapper } from '../../ast/wrappers/typed-object/constrainttype-wrapper';
import { ValidationContext } from '../validation-context';

export function validateTypedConstraintDefinition(
  constraint: TypedConstraintDefinition,
  context: ValidationContext,
): void {
  checkConstraintType(constraint, context);
  // TODO: add custom validations
}

function checkConstraintType(
  constraint: TypedConstraintDefinition,
  context: ValidationContext,
): void {
  const constraintType = constraint?.type;
  if (constraintType === undefined) {
    return undefined;
  }

  const canCreateWrapper = ConstraintWrapper.canBeWrapped(constraintType);
  if (!canCreateWrapper) {
    context.accept(
      'error',
      `Unknown constraint type '${constraintType.$refText ?? ''}'`,
      {
        node: constraint,
        property: 'type',
      },
    );
  }
}
