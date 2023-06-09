// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValueExpression,
  isRuntimeParameterLiteral,
} from '../../../lib';

export class TestPropertyMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'TestProperty',
      // Property definitions:
      {
        textProperty: {
          type: PrimitiveValuetypes.Text,
        },
        customValidationTextProperty: {
          type: PrimitiveValuetypes.Text,
          defaultValue: 'valid',
          validation: (property, validationContext, evaluationContext) => {
            const propertyValue = property.value;
            if (isRuntimeParameterLiteral(propertyValue)) {
              // We currently ignore runtime parameters during validation.
              return;
            }

            const value = evaluatePropertyValueExpression(
              propertyValue,
              evaluationContext,
              PrimitiveValuetypes.Text,
            );

            if (value !== undefined && value !== 'valid') {
              validationContext.accept('error', `Invalid value "${value}"`, {
                node: propertyValue,
              });
            }
          },
        },
        booleanProperty: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: false,
        },
        integerProperty: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 0,
        },
        decimalProperty: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: 0.0,
        },
        regexProperty: {
          type: PrimitiveValuetypes.Regex,
          defaultValue: /\r?\n/,
        },
        collectionProperty: {
          type: PrimitiveValuetypes.Collection,
          defaultValue: [],
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.TABLE,
    );
  }
}
