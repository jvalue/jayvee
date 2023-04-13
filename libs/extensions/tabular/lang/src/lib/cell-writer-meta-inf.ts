// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  PropertyValuetype,
  isCellRangeLiteral,
  isCollectionLiteral,
} from '@jvalue/jayvee-language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'CellWriter',
      {
        write: {
          type: PropertyValuetype.COLLECTION,
          docs: {
            description: 'The values to write.',
            examples: [
              {
                code: 'write: ["Name"]',
                description: 'Write the value "Name" into the cell',
              },
            ],
          },
        },
        at: {
          type: PropertyValuetype.CELL_RANGE,
          validation: (property, accept) => {
            const propertyValue = property.value;
            if (!isCellRangeLiteral(propertyValue)) {
              return;
            }

            if (!CellRangeWrapper.canBeWrapped(propertyValue)) {
              return;
            }
            const semanticCellRange = new CellRangeWrapper(propertyValue);
            if (!semanticCellRange.isOneDimensional()) {
              accept('error', 'The cell range needs to be one-dimensional', {
                node: semanticCellRange.astNode,
              });
            }
          },
          docs: {
            description: 'The cells to write into.',
            examples: [
              {
                code: 'at: range A1:A3',
                description: 'Write into cells A1, A2 and A3',
              },
            ],
            validation: 'Needs to be a one-dimensional range of cells.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
      (propertyBody, accept) => {
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
            accept(
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
        code: blockExample,
        description: 'Write the values "Name", "Age" into cells `A1` and `A2`.',
      },
    ];
  }
}

const blockExample = `block NameHeaderWriter oftype CellWriter {
  at: range A1:A2;
  write: ["Name", "Age"];
}`;
