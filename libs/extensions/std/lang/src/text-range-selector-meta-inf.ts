// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  PropertyAssignment,
  PropertyValuetype,
  isNumericLiteral,
} from '@jvalue/language-server';
import { ValidationAcceptor } from 'langium';

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

      (propertyBody, accept) => {
        const lineFromProperty = propertyBody.properties.find(
          (p) => p.name === 'lineFrom',
        );
        const lineToProperty = propertyBody.properties.find(
          (p) => p.name === 'lineTo',
        );

        if (lineFromProperty === undefined || lineToProperty === undefined) {
          return;
        }

        assert(isNumericLiteral(lineFromProperty.value));
        assert(isNumericLiteral(lineToProperty.value));

        const lineFrom = lineFromProperty.value.value;
        const lineTo = lineToProperty.value.value;

        if (lineFrom > lineTo) {
          [lineFromProperty, lineToProperty].forEach((property) => {
            accept(
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
  accept: ValidationAcceptor,
) {
  const propertyValue = property.value;
  assert(isNumericLiteral(propertyValue));

  if (propertyValue.value <= 0) {
    accept('error', `Line numbers need to be greater than zero`, {
      node: propertyValue,
    });
  }
}
