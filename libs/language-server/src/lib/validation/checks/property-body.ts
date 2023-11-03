// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { TypedObjectWrapper, getTypedObjectWrapper } from '../../ast';
import { EvaluationContext } from '../../ast/expressions/evaluation';
import {
  PropertyAssignment,
  PropertyBody,
  isBlockDefinition,
  isTypedConstraintDefinition,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

import { checkBlocktypeSpecificPropertyBody } from './blocktype-specific/property-body';
import { checkConstraintTypeSpecificPropertyBody } from './constrainttype-specific/property-body';
import { validatePropertyAssignment } from './property-assignment';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const properties = propertyBody?.properties ?? [];
  checkUniqueNames(properties, validationContext);

  const wrapper = inferTypedObjectWrapper(propertyBody);
  if (wrapper === undefined) {
    return;
  }

  checkPropertyCompleteness(
    propertyBody,
    properties,
    wrapper,
    validationContext,
  );
  for (const property of propertyBody.properties) {
    validatePropertyAssignment(
      property,
      wrapper,
      validationContext,
      evaluationContext,
    );
  }
  if (validationContext.hasErrorOccurred()) {
    return;
  }

  checkCustomPropertyValidation(
    propertyBody,
    wrapper,
    validationContext,
    evaluationContext,
  );
}

function inferTypedObjectWrapper(
  propertyBody: PropertyBody,
): TypedObjectWrapper | undefined {
  const type = propertyBody.$container?.type.ref;
  return getTypedObjectWrapper(type);
}

function checkPropertyCompleteness(
  propertyBody: PropertyBody,
  properties: PropertyAssignment[],
  wrapper: TypedObjectWrapper,
  context: ValidationContext,
): void {
  const presentPropertyNames = properties.map((property) => property.name);
  const missingRequiredPropertyNames =
    wrapper.getMissingRequiredPropertyNames(presentPropertyNames);

  if (missingRequiredPropertyNames.length > 0) {
    context.accept(
      'error',
      `The following required properties are missing: ${missingRequiredPropertyNames
        .map((name) => `"${name}"`)
        .join(', ')}`,
      {
        node: propertyBody.$container,
        property: 'type',
      },
    );
  }
}

function checkCustomPropertyValidation(
  propertyBody: PropertyBody,
  wrapper: TypedObjectWrapper,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  wrapper.validate(propertyBody, validationContext, evaluationContext);

  if (isBlockDefinition(propertyBody.$container)) {
    checkBlocktypeSpecificPropertyBody(
      propertyBody,
      validationContext,
      evaluationContext,
    );
  } else if (isTypedConstraintDefinition(propertyBody.$container)) {
    checkConstraintTypeSpecificPropertyBody(
      propertyBody,
      validationContext,
      evaluationContext,
    );
  }
}
