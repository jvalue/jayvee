// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
  isColumnWrapper,
} from '@jvalue/jayvee-language-server';

export class ColumnDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'ColumnDeleter',
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
              if (!isColumnWrapper(cellRange)) {
                validationContext.accept(
                  'error',
                  'An entire column needs to be selected',
                  {
                    node: cellRange.astNode,
                  },
                );
              }
            });
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
