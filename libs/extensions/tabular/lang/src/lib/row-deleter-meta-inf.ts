// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
  isRowWrapper,
} from '@jvalue/jayvee-language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'RowDeleter',
      {
        delete: {
          type: new CollectionValuetype(PrimitiveValuetypes.CellRange),
          validation: (property, validationContext, evaluationContext) => {
            const cellRanges = evaluatePropertyValue(
              property,
              evaluationContext,
              new CollectionValuetype(PrimitiveValuetypes.CellRange),
            );

            cellRanges?.forEach((cellRange) => {
              if (!isRowWrapper(cellRange)) {
                validationContext.accept(
                  'error',
                  'An entire row needs to be selected',
                  {
                    node: cellRange.astNode,
                  },
                );
              }
            });
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
