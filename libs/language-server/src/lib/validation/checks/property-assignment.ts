// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  EvaluationContext,
  PropertySpecification,
  TypedObjectWrapper,
  WrapperFactory,
  inferExpressionType,
} from '../../ast';
import {
  PropertyAssignment,
  isBlocktypeProperty,
  isRuntimeParameterLiteral,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkExpressionSimplification } from '../validation-util';

import { checkBlocktypeSpecificProperties } from './blocktype-specific/property-assignment';

export function validatePropertyAssignment(
  property: PropertyAssignment,
  wrapper: TypedObjectWrapper,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  const propertySpec = wrapper.getPropertySpecification(property?.name);

  checkPropertyNameValidity(property, propertySpec, validationContext);

  if (propertySpec === undefined) {
    return;
  }
  checkPropertyValueTyping(
    property,
    propertySpec,
    validationContext,
    evaluationContext,
    wrapperFactory,
  );

  if (validationContext.hasErrorOccurred()) {
    return;
  }

  checkBlocktypeSpecificProperties(
    property,
    propertySpec,
    validationContext,
    evaluationContext,
    wrapperFactory,
  );
}

function checkPropertyNameValidity(
  property: PropertyAssignment,
  propertySpec: PropertySpecification | undefined,
  context: ValidationContext,
): void {
  if (propertySpec === undefined) {
    context.accept(
      'error',
      `Invalid property name "${property?.name ?? ''}".`,
      {
        node: property,
        property: 'name',
      },
    );
  }
}

function checkPropertyValueTyping(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  const propertyType = propertySpec.type;
  const propertyValue = property?.value;
  if (propertyValue === undefined) {
    return;
  }

  if (isRuntimeParameterLiteral(propertyValue)) {
    if (!propertyType.isAllowedAsRuntimeParameter()) {
      validationContext.accept(
        'error',
        `Runtime parameters are not allowed for properties of type ${propertyType.getName()}`,
        {
          node: propertyValue,
        },
      );
    }
    return;
  }

  if (isBlocktypeProperty(propertyValue)) {
    return;
  }

  const inferredType = inferExpressionType(propertyValue, validationContext);
  if (inferredType === undefined) {
    return;
  }

  if (!inferredType.isConvertibleTo(propertyType)) {
    validationContext.accept(
      'error',
      `The value of property "${
        property.name
      }" needs to be of type ${propertyType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: propertyValue,
      },
    );
    return;
  }

  checkExpressionSimplification(
    propertyValue,
    validationContext,
    evaluationContext,
    wrapperFactory,
  );
}
