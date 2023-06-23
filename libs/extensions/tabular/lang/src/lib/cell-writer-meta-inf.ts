// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
} from '@jvalue/jayvee-language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'CellWriter',
      {
        write: {
          type: new CollectionValuetype(PrimitiveValuetypes.Text),
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
          validation: (property, validationContext, evaluationContext) => {
            const cellRange = evaluatePropertyValue(
              property,
              evaluationContext,
              PrimitiveValuetypes.CellRange,
            );
            if (cellRange === undefined) {
              return;
            }

            if (!cellRange.isOneDimensional()) {
              validationContext.accept(
                'error',
                'The cell range needs to be one-dimensional',
                {
                  node: cellRange.astNode,
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
      (propertyBody, validationContext, evaluationContext) => {
        const writeProperty = propertyBody.properties.find(
          (p) => p.name === 'write',
        );
        const atProperty = propertyBody.properties.find((p) => p.name === 'at');

        if (writeProperty === undefined || atProperty === undefined) {
          return;
        }

        const writeValues = evaluatePropertyValue(
          writeProperty,
          evaluationContext,
          new CollectionValuetype(PrimitiveValuetypes.Text),
        );

        const atValue = evaluatePropertyValue(
          atProperty,
          evaluationContext,
          PrimitiveValuetypes.CellRange,
        );

        if (writeValues === undefined || atValue === undefined) {
          return;
        }

        const numberOfValuesToWrite = writeValues.length;
        const numberOfCells = atValue.numberOfCells();

        if (numberOfCells !== numberOfValuesToWrite) {
          [writeProperty, atProperty].forEach((propertyNode) => {
            validationContext.accept(
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
