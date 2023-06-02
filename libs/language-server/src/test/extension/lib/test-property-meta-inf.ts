// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TextDecoder } from 'util';

import {
  BlockMetaInformation,
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
          docs: {
            description: 'Required text property.',
          },
        },
        customValidationTextProperty: {
          type: PrimitiveValuetypes.Text,
          defaultValue: 'utf-8',
          docs: {
            description:
              'Text property with custom validation and default value.',
          },
          validation: (property, context) => {
            const propertyValue = property.value;
            if (isRuntimeParameterLiteral(propertyValue)) {
              // We currently ignore runtime parameters during validation.
              return;
            }

            const encodingValue = evaluatePropertyValueExpression(
              propertyValue,
              new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
              STRING_TYPEGUARD,
            );

            try {
              new TextDecoder(encodingValue);
            } catch (error) {
              context.accept('error', `Unknown encoding "${encodingValue}"`, {
                node: propertyValue,
              });
            }
          },
        },
        booleanProperty: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: false,
          docs: {
            description: 'Boolean property with default value',
          },
        },
        integerProperty: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 0,
          docs: {
            description: 'Integer property with default value',
          },
        },
        decimalProperty: {
          type: PrimitiveValuetypes.Decimal,
          defaultValue: 0.0,
          docs: {
            description: 'Decimal property with default value',
          },
        },
        regexProperty: {
          type: PrimitiveValuetypes.Regex,
          defaultValue: /\r?\n/,
          docs: {
            description: 'Regex property with default value',
          },
        },
        collectionProperty: {
          type: PrimitiveValuetypes.Collection,
          defaultValue: [],
          docs: {
            description: 'Collection property with default value',
          },
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.TABLE,
    );
    this.docs.description =
      'Test block for different types of properties, requiring IOType.FILE and outputting IOType.TABLE.';
  }
}
