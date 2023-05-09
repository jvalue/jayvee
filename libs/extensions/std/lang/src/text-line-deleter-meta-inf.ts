// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  NUMBER_TYPEGUARD,
  PrimitiveValuetypes,
  evaluatePropertyValueExpression,
  isCollectionLiteral,
  isExpression,
  validateTypedCollection,
} from '@jvalue/jayvee-language-server';

export class TextLineDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextLineDeleter',
      {
        lines: {
          type: PrimitiveValuetypes.Collection,
          validation: (property, context) => {
            const propertyValue = property.value;
            assert(isCollectionLiteral(propertyValue));

            const { validItems, invalidItems } = validateTypedCollection(
              propertyValue,
              [PrimitiveValuetypes.Integer],
              context,
            );

            invalidItems.forEach((invalidValue) =>
              context.accept(
                'error',
                'Only integers are allowed in this collection',
                {
                  node: invalidValue,
                },
              ),
            );

            assert(validItems.every(isExpression));

            for (const expression of validItems) {
              const value = evaluatePropertyValueExpression(
                expression,
                NUMBER_TYPEGUARD,
              );

              if (value <= 0) {
                context.accept(
                  'error',
                  `Line numbers need to be greater than zero`,
                  {
                    node: expression,
                  },
                );
              }
            }
          },
          docs: {
            description: 'The line numbers to delete.',
          },
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Deletes individual lines from a `TextFile`.';
  }
}
