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
          description: 'Speficy the value to write.',
          examples: [
            {
              code: 'write: "Name"',
              description: 'Write value "Name" into the cell',
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
          description: 'Speficy the cell position to write into.',
          examples: [{ code: 'at: A1', description: 'Write into cell A1' }],
          validation: 'You need to specify exactly one cell.',
        },
      },
    });
    this.docs.description = 'Writes a `String` value into a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Write the string value "Name" into cell `A1`.',
      },
    ];
  }
}

const blockExample = `block CarColumnNameWriter oftype CellWriter {
  at: cell A1;
  write: "Name";
}`;
