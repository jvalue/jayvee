// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  EvaluationContext,
  IOType,
  PrimitiveValuetypes,
  STRING_TYPEGUARD,
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
          validation: (property, context) => {
            const propertyValue = property.value;
            if (isRuntimeParameterLiteral(propertyValue)) {
              // We currently ignore runtime parameters during validation.
              return;
            }

            const value = evaluatePropertyValueExpression(
              propertyValue,
              new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
              STRING_TYPEGUARD,
            );

            if (value !== 'valid') {
              context.accept('error', `Invalid value "${value}"`, {
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
        textCollectionProperty: {
          type: new CollectionValuetype(PrimitiveValuetypes.Text),
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
