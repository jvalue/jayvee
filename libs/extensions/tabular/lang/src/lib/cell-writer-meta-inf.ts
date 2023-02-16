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
      },
    });
  }
}
