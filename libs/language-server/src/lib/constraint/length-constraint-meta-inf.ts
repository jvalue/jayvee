// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { evaluatePropertyValueExpression } from '../ast/expressions/evaluation';
import { NUMBER_TYPEGUARD } from '../ast/expressions/typeguards';
import { PropertyAssignment } from '../ast/generated/ast';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';
import { ValidationContext } from '../validation/validation-context';

export class LengthConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'LengthConstraint',
      {
        minLength: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 0,
          validation: nonNegativeValidation,
        },
        maxLength: {
          type: PrimitiveValuetypes.Integer,
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

        const minLength = evaluatePropertyValueExpression(
          minLengthProperty.value,
          NUMBER_TYPEGUARD,
        );
        const maxLength = evaluatePropertyValueExpression(
          maxLengthProperty.value,
          NUMBER_TYPEGUARD,
        );

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
  const value = evaluatePropertyValueExpression(
    propertyValue,
    NUMBER_TYPEGUARD,
  );

  if (value < 0) {
    context.accept(
      'error',
      `Bounds for length need to be equal or greater than zero`,
      {
        node: propertyValue,
      },
    );
  }
}
