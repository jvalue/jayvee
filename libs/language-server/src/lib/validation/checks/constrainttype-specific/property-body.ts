// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  PrimitiveValuetypes,
  PropertyBody,
  evaluatePropertyValue,
} from '../../../ast';
import { ValidationContext } from '../../validation-context';

export function checkConstraintTypeSpecificPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  switch (propertyBody.$container.type.ref?.name) {
    case 'LengthConstraint':
      return checkLengthConstraintPropertyBody(
        propertyBody,
        validationContext,
        evaluationContext,
      );
    case 'RangeConstraint':
      return checkRangeConstraintPropertyBody(
        propertyBody,
        validationContext,
        evaluationContext,
      );
    default:
  }
}

function checkLengthConstraintPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const minLengthProperty = propertyBody.properties.find(
    (p) => p.name === 'minLength',
  );
  const maxLengthProperty = propertyBody.properties.find(
    (p) => p.name === 'maxLength',
  );

  if (minLengthProperty === undefined || maxLengthProperty === undefined) {
    return;
  }

  const minLength = evaluatePropertyValue(
    minLengthProperty,
    evaluationContext,
    PrimitiveValuetypes.Integer,
  );
  const maxLength = evaluatePropertyValue(
    maxLengthProperty,
    evaluationContext,
    PrimitiveValuetypes.Integer,
  );
  if (minLength === undefined || maxLength === undefined) {
    return;
  }

  if (minLength > maxLength) {
    [minLengthProperty, maxLengthProperty].forEach((property) => {
      validationContext.accept(
        'error',
        'The minimum length needs to be smaller or equal to the maximum length',
        { node: property.value },
      );
    });
  }
}

function checkRangeConstraintPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const lowerBoundProperty = propertyBody.properties.find(
    (p) => p.name === 'lowerBound',
  );
  const upperBoundProperty = propertyBody.properties.find(
    (p) => p.name === 'upperBound',
  );

  if (lowerBoundProperty === undefined || upperBoundProperty === undefined) {
    return;
  }

  const lowerBound = evaluatePropertyValue(
    lowerBoundProperty,
    evaluationContext,
    PrimitiveValuetypes.Decimal,
  );
  const upperBound = evaluatePropertyValue(
    upperBoundProperty,
    evaluationContext,
    PrimitiveValuetypes.Decimal,
  );
  if (lowerBound === undefined || upperBound === undefined) {
    return;
  }

  if (lowerBound > upperBound) {
    [lowerBoundProperty, upperBoundProperty].forEach((property) => {
      validationContext.accept(
        'error',
        'The lower bound needs to be smaller or equal to the upper bound',
        { node: property.value },
      );
    });
    return;
  }

  const lowerBoundInclusiveProperty = propertyBody.properties.find(
    (p) => p.name === 'lowerBoundInclusive',
  );
  const upperBoundInclusiveProperty = propertyBody.properties.find(
    (p) => p.name === 'upperBoundInclusive',
  );

  if (lowerBound === upperBound) {
    let lowerBoundInclusive = true;
    if (lowerBoundInclusiveProperty !== undefined) {
      const expressionValue = evaluatePropertyValue(
        lowerBoundInclusiveProperty,
        evaluationContext,
        PrimitiveValuetypes.Boolean,
      );
      if (expressionValue === undefined) {
        return;
      }
      lowerBoundInclusive = expressionValue;
    }

    let upperBoundInclusive = true;
    if (upperBoundInclusiveProperty !== undefined) {
      const expressionValue = evaluatePropertyValue(
        upperBoundInclusiveProperty,
        evaluationContext,
        PrimitiveValuetypes.Boolean,
      );
      if (expressionValue === undefined) {
        return;
      }
      upperBoundInclusive = expressionValue;
    }

    const errorMessage =
      'Lower and upper bounds need to be inclusive if they are identical';
    if (!lowerBoundInclusive) {
      validationContext.accept('error', errorMessage, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        node: lowerBoundInclusiveProperty!.value,
      });
    }
    if (!upperBoundInclusive) {
      validationContext.accept('error', errorMessage, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        node: upperBoundInclusiveProperty!.value,
      });
    }
  }
}
