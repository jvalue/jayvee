// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
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
            const value = evaluatePropertyValue(
              property,
              evaluationContext,
              PrimitiveValuetypes.Text,
            );

            if (value !== undefined && value !== 'valid') {
              validationContext.accept('error', `Invalid value "${value}"`, {
                node: property.value,
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
        valuetypeAssignmentProperty: {
          type: PrimitiveValuetypes.ValuetypeAssignment,
          defaultValue: '"test" oftype text',
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.TABLE,
    );
  }
}
