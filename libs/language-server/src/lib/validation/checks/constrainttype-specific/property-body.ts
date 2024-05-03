// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type PropertyBody, evaluatePropertyValue } from '../../../ast';
import { type JayveeValidationProps } from '../../validation-registry';

export function checkConstraintTypeSpecificPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  switch (propertyBody.$container.type.ref?.name) {
    case 'LengthConstraint':
      return checkLengthConstraintPropertyBody(propertyBody, props);
    case 'RangeConstraint':
      return checkRangeConstraintPropertyBody(propertyBody, props);
    default:
  }
}

function checkLengthConstraintPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  const minLengthProperty = propertyBody.properties.find(
    (p) => p.name === 'minLength',
  );
  const maxLengthProperty = propertyBody.properties.find(
    (p) => p.name === 'maxLength',
  );

  if (minLengthProperty === undefined && maxLengthProperty === undefined) {
    props.validationContext.accept(
      'hint',
      'This constraint should either specify an upper or lower bound, otherwise it has no effect.',
      { node: propertyBody },
    );
  }

  if (minLengthProperty === undefined || maxLengthProperty === undefined) {
    return;
  }

  const minLength = evaluatePropertyValue(
    minLengthProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Integer,
  );
  const maxLength = evaluatePropertyValue(
    maxLengthProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Integer,
  );
  if (minLength === undefined || maxLength === undefined) {
    return;
  }

  if (minLength > maxLength) {
    [minLengthProperty, maxLengthProperty].forEach((property) => {
      props.validationContext.accept(
        'error',
        'The minimum length needs to be smaller or equal to the maximum length',
        { node: property.value },
      );
    });
  }
}

function checkRangeConstraintPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  const lowerBoundProperty = propertyBody.properties.find(
    (p) => p.name === 'lowerBound',
  );
  const upperBoundProperty = propertyBody.properties.find(
    (p) => p.name === 'upperBound',
  );

  if (lowerBoundProperty === undefined && upperBoundProperty === undefined) {
    props.validationContext.accept(
      'hint',
      'This constraint should either specify an upper or lower bound, otherwise it has no effect.',
      { node: propertyBody },
    );
  }

  if (lowerBoundProperty === undefined || upperBoundProperty === undefined) {
    return;
  }

  const lowerBound = evaluatePropertyValue(
    lowerBoundProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Decimal,
  );
  const upperBound = evaluatePropertyValue(
    upperBoundProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Decimal,
  );
  if (lowerBound === undefined || upperBound === undefined) {
    return;
  }

  if (lowerBound > upperBound) {
    [lowerBoundProperty, upperBoundProperty].forEach((property) => {
      props.validationContext.accept(
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
        props.evaluationContext,
        props.wrapperFactories,
        props.valueTypeProvider.Primitives.Boolean,
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
        props.evaluationContext,
        props.wrapperFactories,
        props.valueTypeProvider.Primitives.Boolean,
      );
      if (expressionValue === undefined) {
        return;
      }
      upperBoundInclusive = expressionValue;
    }

    const errorMessage =
      'Lower and upper bounds need to be inclusive if they are identical';
    if (!lowerBoundInclusive) {
      props.validationContext.accept('error', errorMessage, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        node: lowerBoundInclusiveProperty!.value,
      });
    }
    if (!upperBoundInclusive) {
      props.validationContext.accept('error', errorMessage, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        node: upperBoundInclusiveProperty!.value,
      });
    }
  }
}
