// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  NUMBER_TYPEGUARD,
  PrimitiveValuetypes,
  PropertyAssignment,
  ValidationContext,
  evaluatePropertyValueExpression,
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

        const lineFrom = evaluatePropertyValueExpression(
          lineFromProperty.value,
          NUMBER_TYPEGUARD,
        );
        const lineTo = evaluatePropertyValueExpression(
          lineToProperty.value,
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

  const value = evaluatePropertyValueExpression(
    propertyValue,
    NUMBER_TYPEGUARD,
  );

  if (value <= 0) {
    context.accept('error', `Line numbers need to be greater than zero`, {
      node: propertyValue,
    });
  }
}
