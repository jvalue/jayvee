// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  PrimitiveValuetypes,
  PropertyAssignment,
  PropertySpecification,
  WrapperFactory,
  evaluatePropertyValue,
} from '../../../ast';
import { ValidationContext } from '../../validation-context';

export function checkConstraintTypeSpecificProperties(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  const propName = property.name;
  const propValue = evaluatePropertyValue(
    property,
    evaluationContext,
    wrapperFactory,
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
        wrapperFactory,
      );
    default:
  }
}

function checkLengthConstraintProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'minLength') {
    checkNonNegative(
      property,
      validationContext,
      evaluationContext,
      wrapperFactory,
    );
  }
  if (propName === 'maxLength') {
    checkNonNegative(
      property,
      validationContext,
      evaluationContext,
      wrapperFactory,
    );
  }
}

function checkNonNegative(
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  const value = evaluatePropertyValue(
    property,
    evaluationContext,
    wrapperFactory,
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
