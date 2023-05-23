// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { isRuntimeParameterLiteral } from '../ast';
import {
  EvaluationContext,
  evaluatePropertyValueExpression,
} from '../ast/expressions/evaluation';
import {
  BOOLEAN_TYPEGUARD,
  NUMBER_TYPEGUARD,
} from '../ast/expressions/typeguards';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: Number.NEGATIVE_INFINITY,
        },
        lowerBoundInclusive: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
        },
        upperBound: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: Number.POSITIVE_INFINITY,
        },
        upperBoundInclusive: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
        },
      },
      PrimitiveValuetypes.Decimal,
      (propertyBody, context) => {
        const lowerBoundProperty = propertyBody.properties.find(
          (p) => p.name === 'lowerBound',
        );
        const upperBoundProperty = propertyBody.properties.find(
          (p) => p.name === 'upperBound',
        );

        if (
          lowerBoundProperty === undefined ||
          upperBoundProperty === undefined
        ) {
          return;
        }

        if (
          isRuntimeParameterLiteral(lowerBoundProperty.value) ||
          isRuntimeParameterLiteral(upperBoundProperty.value)
        ) {
          // We currently ignore runtime parameters during validation.
          return;
        }

        const lowerBound = evaluatePropertyValueExpression(
          lowerBoundProperty.value,
          new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
          NUMBER_TYPEGUARD,
        );
        const upperBound = evaluatePropertyValueExpression(
          upperBoundProperty.value,
          new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
          NUMBER_TYPEGUARD,
        );

        if (lowerBound > upperBound) {
          [lowerBoundProperty, upperBoundProperty].forEach((property) => {
            context.accept(
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
            if (isRuntimeParameterLiteral(lowerBoundInclusiveProperty.value)) {
              // We currently ignore runtime parameters during validation.
              return;
            }
            const expressionValue = evaluatePropertyValueExpression(
              lowerBoundInclusiveProperty.value,
              new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
              BOOLEAN_TYPEGUARD,
            );
            lowerBoundInclusive = expressionValue;
          }

          let upperBoundInclusive = true;
          if (upperBoundInclusiveProperty !== undefined) {
            if (isRuntimeParameterLiteral(upperBoundInclusiveProperty.value)) {
              // We currently ignore runtime parameters during validation.
              return;
            }
            const expressionValue = evaluatePropertyValueExpression(
              upperBoundInclusiveProperty.value,
              new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
              BOOLEAN_TYPEGUARD,
            );
            upperBoundInclusive = expressionValue;
          }

          const errorMessage =
            'Lower and upper bounds need to be inclusive if they are identical';
          if (!lowerBoundInclusive) {
            context.accept('error', errorMessage, {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              node: lowerBoundInclusiveProperty!.value,
            });
          }
          if (!upperBoundInclusive) {
            context.accept('error', errorMessage, {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              node: upperBoundInclusiveProperty!.value,
            });
          }
        }
      },
    );
    super.docs = {
      description:
        'Limits the range of a number value with an upper and/or lower boundary which can be inclusive or exclusive. Only values within the given range are considered valid.',
      examples: [
        {
          description: 'A scale between 1 and 100.',
          code: `constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  upperBound: 100;		
}`,
        },
        {
          description: 'A scale between 0 (excluded) and 100.',
          code: `constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  lowerBoundInclusive: false;
  upperBound: 100;		
}`,
        },
      ],
    };
  }
}
