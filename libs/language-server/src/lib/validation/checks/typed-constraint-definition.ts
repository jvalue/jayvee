/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { type TypedConstraintDefinition } from '../../ast/generated/ast';
import { ConstraintTypeWrapper } from '../../ast/wrappers/typed-object/constrainttype-wrapper';
import { type JayveeValidationProps } from '../validation-registry';

export function validateTypedConstraintDefinition(
  constraint: TypedConstraintDefinition,
  props: JayveeValidationProps,
): void {
  checkConstraintType(constraint, props);
  // TODO: add custom validations
}

function checkConstraintType(
  constraint: TypedConstraintDefinition,
  props: JayveeValidationProps,
): void {
  const constraintType = constraint?.type;
  if (constraintType === undefined) {
    return undefined;
  }

  const canCreateWrapper = ConstraintTypeWrapper.canBeWrapped(constraintType);
  if (!canCreateWrapper) {
    props.validationContext.accept(
      'error',
      `Unknown constraint type '${constraintType.$refText ?? ''}'`,
      {
        node: constraint,
        property: 'type',
      },
    );
  }
}
