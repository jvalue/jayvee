// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  PropertyValuetype,
  isCellRangeLiteral,
  isCellWrapper,
} from '@jvalue/jayvee-language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'CellWriter',
      {
        write: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The value to write.',
            examples: [
              {
                code: 'write: "Name"',
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
            if (!isCellWrapper(semanticCellRange)) {
              accept('error', 'A single cell needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          },
          docs: {
            description: 'The cell to write into.',
            examples: [{ code: 'at: A1', description: 'Write into cell A1' }],
            validation: 'You need to specify exactly one cell.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
    );
    this.docs.description = 'Writes a textual value into a cell of a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Write the value "Name" into cell `A1`.',
      },
    ];
  }
}

const blockExample = `block NameHeaderWriter oftype CellWriter {
  at: cell A1;
  write: "Name";
}`;
