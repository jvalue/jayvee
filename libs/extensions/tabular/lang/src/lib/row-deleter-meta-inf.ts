// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  PrimitiveValuetypes,
  isCellRangeLiteral,
  isCollectionLiteral,
  isRowWrapper,
  validateTypedCollection,
} from '@jvalue/jayvee-language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'RowDeleter',
      {
        delete: {
          type: PrimitiveValuetypes.Collection,
          validation: (property, context) => {
            const propertyValue = property.value;
            if (!isCollectionLiteral(propertyValue)) {
              return;
            }

            const { validItems, invalidItems } = validateTypedCollection(
              propertyValue,
              [PrimitiveValuetypes.CellRange],
              context,
            );

            invalidItems.forEach((invalidValue) =>
              context.accept(
                'error',
                'Only cell ranges are allowed in this collection',
                {
                  node: invalidValue,
                },
              ),
            );

            assert(validItems.every(isCellRangeLiteral));

            for (const collectionValue of validItems) {
              if (!CellRangeWrapper.canBeWrapped(collectionValue)) {
                continue;
              }
              const semanticCellRange = new CellRangeWrapper(collectionValue);
              if (!isRowWrapper(semanticCellRange)) {
                context.accept('error', 'An entire row needs to be selected', {
                  node: semanticCellRange.astNode,
                });
              }
            }
          },
          docs: {
            description: 'The rows to delete.',
            examples: [
              {
                code: 'delete: [row 2]',
                description: 'Delete row 2.',
              },
              {
                code: 'delete: [row 2, row 3]',
                description: 'Delete row 2 and row 3.',
              },
            ],
            validation: 'You need to specify at least one row.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
    );

    this.docs.description =
      'Deletes one or more rows from a `Sheet`. Row IDs of subsequent rows will be shifted accordingly, so there will be no gaps.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Deletes row 2 (i.e. the second row).',
      },
    ];
  }
}

const blockExample = `block SecondRowDeleter oftype RowDeleter {
  delete: [row 2];
}`;
