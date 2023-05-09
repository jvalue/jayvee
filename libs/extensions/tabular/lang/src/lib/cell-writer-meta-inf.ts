// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  PrimitiveValuetypes,
  isCellRangeLiteral,
  isCollectionLiteral,
  validateTypedCollection,
} from '@jvalue/jayvee-language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'CellWriter',
      {
        write: {
          type: PrimitiveValuetypes.Collection,
          docs: {
            description: 'The values to write.',
            examples: [
              {
                code: 'write: ["Name"]',
                description: 'Write the value "Name" into the cell.',
              },
              {
                code: 'write: ["Name1", "Name2"]',
                description:
                  'Write the value "Name1" into the first cell and "Name2 into the second.',
              },
            ],
          },
        },
        at: {
          type: PrimitiveValuetypes.CellRange,
          validation: (property, context) => {
            const propertyValue = property.value;
            if (!isCellRangeLiteral(propertyValue)) {
              return;
            }

            if (!CellRangeWrapper.canBeWrapped(propertyValue)) {
              return;
            }
            const semanticCellRange = new CellRangeWrapper(propertyValue);
            if (!semanticCellRange.isOneDimensional()) {
              context.accept(
                'error',
                'The cell range needs to be one-dimensional',
                {
                  node: semanticCellRange.astNode,
                },
              );
            }
          },
          docs: {
            description: 'The cells to write into.',
            examples: [
              {
                code: 'at: cell A1',
                description: 'Write into cell A1.',
              },
              {
                code: 'at: range A1:A3',
                description: 'Write into cells A1, A2 and A3.',
              },
            ],
            validation: 'Needs to be a one-dimensional range of cells.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
      (propertyBody, context) => {
        const writeProperty = propertyBody.properties.find(
          (p) => p.name === 'write',
        );
        const atProperty = propertyBody.properties.find((p) => p.name === 'at');

        if (writeProperty === undefined || atProperty === undefined) {
          return;
        }

        if (!isCollectionLiteral(writeProperty.value)) {
          return;
        }
        const { invalidItems } = validateTypedCollection(
          writeProperty.value,
          [PrimitiveValuetypes.Text],
          context,
        );

        invalidItems.forEach((invalidValue) =>
          context.accept(
            'error',
            'Only text values are allowed in this collection',
            {
              node: invalidValue,
            },
          ),
        );
        if (invalidItems.length > 0) {
          return;
        }

        if (!isCellRangeLiteral(atProperty.value)) {
          return;
        }

        const numberOfValuesToWrite = writeProperty.value.values.length;

        if (!CellRangeWrapper.canBeWrapped(atProperty.value)) {
          return;
        }
        const semanticCellRange = new CellRangeWrapper(atProperty.value);
        const numberOfCells = semanticCellRange.numberOfCells();

        if (numberOfCells !== numberOfValuesToWrite) {
          [writeProperty, atProperty].forEach((propertyNode) => {
            context.accept(
              'warning',
              `The number of values to write (${numberOfValuesToWrite}) does not match the number of cells (${numberOfCells})`,
              { node: propertyNode.value },
            );
          });
        }
      },
    );
    this.docs.description =
      'Writes textual values into cells of a `Sheet`. The number of text values needs to match the number of cells to write into.';
    this.docs.examples = [
      {
        code: blockExampleSingleCell,
        description: 'Write the value "Name" into cell `A1`.',
      },
      {
        code: blockExampleCellRange,
        description: 'Write the values "Name", "Age" into cells `A1` and `A2`.',
      },
    ];
  }
}

const blockExampleSingleCell = `block NameHeaderWriter oftype CellWriter {
  at: cell A1;
  write: ["Name"];
}`;
const blockExampleCellRange = `block HeaderSequenceWriter oftype CellWriter {
  at: range A1:A2;
  write: ["Name", "Age"];
}`;
