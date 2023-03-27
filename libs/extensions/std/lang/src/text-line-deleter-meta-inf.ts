// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
  isCollectionLiteral,
  isNumericLiteral,
  validateTypedCollection,
} from '@jvalue/language-server';

export class TextLineDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextLineDeleter',
      {
        lines: {
          type: PropertyValuetype.COLLECTION,
          validation: (property, accept) => {
            const propertyValue = property.value;
            assert(isCollectionLiteral(propertyValue));

            const { validItems, invalidItems } = validateTypedCollection(
              propertyValue,
              isNumericLiteral,
            );

            const invalidTypeErrorMessage =
              'Only integers are allowed in this collection';
            invalidItems.forEach((invalidValue) =>
              accept('error', invalidTypeErrorMessage, {
                node: invalidValue,
              }),
            );

            for (const numericLiteral of validItems) {
              if (!Number.isInteger(numericLiteral.value)) {
                accept('error', invalidTypeErrorMessage, {
                  node: numericLiteral,
                });
              }
              if (numericLiteral.value <= 0) {
                accept('error', `Line numbers need to be greater than zero`, {
                  node: numericLiteral,
                });
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
