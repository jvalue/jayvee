// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  PropertyAssignment,
  PropertyValuetype,
  ValidationContext,
  evaluateExpression,
  isExpression,
} from '@jvalue/jayvee-language-server';

export class TextRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextRangeSelector',
      {
        lineFrom: {
          type: PropertyValuetype.INTEGER,
          defaultValue: 1,
          validation: greaterThanZeroValidation,
        },
        lineTo: {
          type: PropertyValuetype.INTEGER,
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

        assert(isExpression(lineFromProperty.value));
        assert(isExpression(lineToProperty.value));

        const lineFrom = evaluateExpression(lineFromProperty.value);
        assert(typeof lineFrom === 'number');
        const lineTo = evaluateExpression(lineToProperty.value);
        assert(typeof lineTo === 'number');

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
  assert(isExpression(propertyValue));

  const value = evaluateExpression(propertyValue);
  assert(typeof value === 'number');

  if (value <= 0) {
    context.accept('error', `Line numbers need to be greater than zero`, {
      node: propertyValue,
    });
  }
}
