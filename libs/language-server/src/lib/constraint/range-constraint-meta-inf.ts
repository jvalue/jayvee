// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { evaluatePropertyValue } from '../ast/expressions/evaluation';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: Number.MIN_SAFE_INTEGER,
        },
        lowerBoundInclusive: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
        },
        upperBound: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: Number.MAX_SAFE_INTEGER,
        },
        upperBoundInclusive: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
        },
      },
      PrimitiveValuetypes.Decimal,
      (propertyBody, validationContext, evaluationContext) => {
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
      },
    );
    super.docs = {
      description:
        'Limits the range of a number value with an upper and/or lower boundary which can be inclusive or exclusive. Only values within the given range are considered valid.',
      examples: [
        {
          description: 'A scale between (and including) 1 and 100.',
          code: `constraint HundredScale oftype RangeConstraint {
  lowerBound: 1;
  upperBound: 100;		
}`,
        },
        {
          description:
            'A scale for numbers strictly larger than 1 and less or equal to 100.',
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
