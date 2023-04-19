// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { PropertyAssignment, isNumericLiteral } from '../ast';
import { PropertyValuetype } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';
import { ValidationContext } from '../validation/validation-context';

export class LengthConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'LengthConstraint',
      {
        minLength: {
          type: PropertyValuetype.INTEGER,
          defaultValue: 0,
          validation: nonNegativeValidation,
        },
        maxLength: {
          type: PropertyValuetype.INTEGER,
          defaultValue: Number.POSITIVE_INFINITY,
          validation: nonNegativeValidation,
        },
      },
      ['text'],
      (propertyBody, context) => {
        const minLengthProperty = propertyBody.properties.find(
          (p) => p.name === 'minLength',
        );
        const maxLengthProperty = propertyBody.properties.find(
          (p) => p.name === 'maxLength',
        );

        if (
          minLengthProperty === undefined ||
          maxLengthProperty === undefined
        ) {
          return;
        }

        assert(isNumericLiteral(minLengthProperty.value));
        assert(isNumericLiteral(maxLengthProperty.value));

        const minLength = minLengthProperty.value.value;
        const maxLength = maxLengthProperty.value.value;

        if (minLength > maxLength) {
          [minLengthProperty, maxLengthProperty].forEach((property) => {
            context.accept(
              'error',
              'The minimum length needs to be smaller or equal to the maximum length',
              { node: property.value },
            );
          });
        }
      },
    );
    super.docs = {
      description:
        'Limits the length of a string with an upper and/or lower boundary. Only values with a length within the given range are valid.',
      examples: [
        {
          description: 'A string with 0 to 2147483647 characters.',
          code: `constraint JavaStringLength oftype LengthConstraint {
  minLength: 0;
  maxLength: 2147483647;
}`,
        },
      ],
    };
  }
}

function nonNegativeValidation(
  property: PropertyAssignment,
  context: ValidationContext,
) {
  const propertyValue = property.value;
  assert(isNumericLiteral(propertyValue));

  if (propertyValue.value < 0) {
    context.accept(
      'error',
      `Bounds for length need to be equal or greater than zero`,
      {
        node: propertyValue,
      },
    );
  }
}
