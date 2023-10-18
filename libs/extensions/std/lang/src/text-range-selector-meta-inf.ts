// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  EvaluationContext,
  IOType,
  PrimitiveValuetypes,
  PropertyAssignment,
  ValidationContext,
  evaluatePropertyValue,
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
          defaultValue: Number.MAX_SAFE_INTEGER,
          validation: greaterThanZeroValidation,
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,

      (propertyBody, validationContext, evaluationContext) => {
        const lineFromProperty = propertyBody.properties.find(
          (p) => p.name === 'lineFrom',
        );
        const lineToProperty = propertyBody.properties.find(
          (p) => p.name === 'lineTo',
        );

        if (lineFromProperty === undefined || lineToProperty === undefined) {
          return;
        }

        const lineFrom = evaluatePropertyValue(
          lineFromProperty,
          evaluationContext,
          PrimitiveValuetypes.Integer,
        );
        const lineTo = evaluatePropertyValue(
          lineToProperty,
          evaluationContext,
          PrimitiveValuetypes.Integer,
        );
        if (lineFrom === undefined || lineTo === undefined) {
          return;
        }

        if (lineFrom > lineTo) {
          [lineFromProperty, lineToProperty].forEach((property) => {
            validationContext.accept(
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

  if (value <= 0) {
    validationContext.accept(
      'error',
      `Line numbers need to be greater than zero`,
      {
        node: property.value,
      },
    );
  }
}
