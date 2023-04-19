// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  evaluateExpression,
  isBooleanExpression,
  isNumericLiteral,
} from '../ast';
import { PropertyValuetype } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: PropertyValuetype.DECIMAL,
          defaultValue: Number.NEGATIVE_INFINITY,
        },
        lowerBoundInclusive: {
          type: PropertyValuetype.BOOLEAN,
          defaultValue: true,
        },
        upperBound: {
          type: PropertyValuetype.DECIMAL,
          defaultValue: Number.POSITIVE_INFINITY,
        },
        upperBoundInclusive: {
          type: PropertyValuetype.BOOLEAN,
          defaultValue: true,
        },
      },
      ['integer', 'decimal'],
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

        assert(isNumericLiteral(lowerBoundProperty.value));
        assert(isNumericLiteral(upperBoundProperty.value));

        const lowerBound = lowerBoundProperty.value.value;
        const upperBound = upperBoundProperty.value.value;

        if (lowerBound > upperBound) {
          [lowerBoundProperty, upperBoundProperty].forEach((property) => {
            context.accept(
              'error',
              'The lower bound needs to be smaller or equal to the upper bound',
              { node: property.value },
            );
          });
        } else if (lowerBound === upperBound) {
          const lowerBoundInclusiveProperty = propertyBody.properties.find(
            (p) => p.name === 'lowerBoundInclusive',
          );
          let lowerBoundInclusive = true;
          if (lowerBoundInclusiveProperty !== undefined) {
            assert(isBooleanExpression(lowerBoundInclusiveProperty.value));
            lowerBoundInclusive = evaluateExpression(
              lowerBoundInclusiveProperty.value,
            );
          }

          const upperBoundInclusiveProperty = propertyBody.properties.find(
            (p) => p.name === 'upperBoundInclusive',
          );
          let upperBoundInclusive = true;
          if (upperBoundInclusiveProperty !== undefined) {
            assert(isBooleanExpression(upperBoundInclusiveProperty.value));
            upperBoundInclusive = evaluateExpression(
              upperBoundInclusiveProperty.value,
            );
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
