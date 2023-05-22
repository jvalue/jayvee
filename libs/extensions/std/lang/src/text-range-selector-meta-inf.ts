// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  EvaluationContext,
  IOType,
  NUMBER_TYPEGUARD,
  PrimitiveValuetypes,
  PropertyAssignment,
  ValidationContext,
  evaluatePropertyValueExpression,
  isRuntimeParameterLiteral,
} from '@jvalue/jayvee-language-server';

export class TextRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextRangeSelector',
      {
        lineFrom: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 1,
          validation: greaterThanZeroValidation,
        },
        lineTo: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: Number.POSITIVE_INFINITY,
          validation: greaterThanZeroValidation,
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,

      (propertyBody, context) => {
        const lineFromProperty = propertyBody.properties.find(
          (p) => p.name === 'lineFrom',
        );
        const lineToProperty = propertyBody.properties.find(
          (p) => p.name === 'lineTo',
        );

        if (lineFromProperty === undefined || lineToProperty === undefined) {
          return;
        }

        if (
          isRuntimeParameterLiteral(lineFromProperty.value) ||
          isRuntimeParameterLiteral(lineToProperty.value)
        ) {
          // We currently ignore runtime parameters during validation.
          return;
        }

        const lineFrom = evaluatePropertyValueExpression(
          lineFromProperty.value,
          new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
          NUMBER_TYPEGUARD,
        );
        const lineTo = evaluatePropertyValueExpression(
          lineToProperty.value,
          new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
          NUMBER_TYPEGUARD,
        );

        if (lineFrom > lineTo) {
          [lineFromProperty, lineToProperty].forEach((property) => {
            context.accept(
              'error',
              'The lower line number needs to be smaller or equal to the upper line number',
              { node: property.value },
            );
          });
        }
      },
    );
    this.docs.description = 'Selects a range of lines from a `TextFile`.';
  }
}

function greaterThanZeroValidation(
  property: PropertyAssignment,
  context: ValidationContext,
) {
  const propertyValue = property.value;

  if (isRuntimeParameterLiteral(propertyValue)) {
    // We currently ignore runtime parameters during validation.
    return;
  }
  const value = evaluatePropertyValueExpression(
    propertyValue,
    new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
    NUMBER_TYPEGUARD,
  );

  if (value <= 0) {
    context.accept('error', `Line numbers need to be greater than zero`, {
      node: propertyValue,
    });
  }
}
