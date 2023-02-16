import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isSemanticCell,
} from '@jayvee/language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CellWriter', SHEET_TYPE, SHEET_TYPE, {
      write: {
        type: AttributeType.STRING,
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
        type: AttributeType.CELL_RANGE,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCellRangeValue(attributeValue)) {
            return;
          }
          const cellRange = attributeValue.value;

          if (!SemanticCellRange.canBeWrapped(cellRange)) {
            return;
          }
          const semanticCelLRange = new SemanticCellRange(cellRange);
          if (!isSemanticCell(semanticCelLRange)) {
            accept('error', 'A single cell needs to be selected', {
              node: semanticCelLRange.astNode,
            });
          }
        },
        docs: {
          description: 'The cell to write into.',
          examples: [{ code: 'at: A1', description: 'Write into cell A1' }],
          validation: 'You need to specify exactly one cell.',
        },
      },
    });
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
