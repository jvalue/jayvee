// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  evaluatePropertyValue,
} from '../ast/expressions/evaluation';
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
      PrimitiveValuetypes.Text,
      (propertyBody, validationContext, evaluationContext) => {
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
      `Bounds for length need to be equal or greater than zero`,
      {
        node: property.value,
      },
    );
  }
}
