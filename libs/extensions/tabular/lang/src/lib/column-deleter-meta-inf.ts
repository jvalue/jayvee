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
  isColumnWrapper,
  validateTypedCollection,
} from '@jvalue/jayvee-language-server';

export class ColumnDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'ColumnDeleter',
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
              if (!isColumnWrapper(semanticCellRange)) {
                context.accept(
                  'error',
                  'An entire column needs to be selected',
                  {
                    node: semanticCellRange.astNode,
                  },
                );
              }
            }
          },
          docs: {
            description: 'The columns to delete.',
            examples: [
              {
                code: 'delete: [column B]',
                description: 'Delete column B.',
              },
              {
                code: 'delete: [column B, column C]',
                description: 'Delete column B and column C.',
              },
            ],
            validation: 'You need to specify at least one column.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
    );
    this.docs.description =
      'Deletes columns from a `Sheet`. Column IDs of subsequent columns will be shifted accordingly, so there will be no gaps.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Deletes column B (i.e. the second column).',
      },
    ];
  }
}

const blockExample = `block MpgColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}`;
