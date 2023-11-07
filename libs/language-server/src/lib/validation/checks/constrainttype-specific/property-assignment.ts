// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  PrimitiveValuetypes,
  PropertyAssignment,
  PropertySpecification,
  evaluatePropertyValue,
} from '../../../ast';
import { ValidationContext } from '../../validation-context';

export function checkConstraintTypeSpecificProperties(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const propName = property.name;
  const propValue = evaluatePropertyValue(
    property,
    evaluationContext,
    propertySpec.type,
  );
  if (propValue === undefined) {
    return;
  }

  switch (property.$container.$container.type.ref?.name) {
    case 'LengthConstraint':
      return checkLengthConstraintProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    default:
  }
}

function checkLengthConstraintProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  if (propName === 'minLength') {
    checkNonNegative(property, validationContext, evaluationContext);
  }
  if (propName === 'maxLength') {
    checkNonNegative(property, validationContext, evaluationContext);
  }
}

function checkNonNegative(
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const value = evaluatePropertyValue(
    property,
    evaluationContext,
    PrimitiveValuetypes.Integer,
  );
  if (value === undefined) {
    return;
  }

  if (value < 0) {
    validationContext.accept(
      'error',
      `Bounds for "${property.name}" need to be equal or greater than zero`,
      {
        node: property.value,
      },
    );
  }
}
