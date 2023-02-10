import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeCollection,
  isSemanticColumn,
} from '@jayvee/language-server';

export class ColumnDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('ColumnDeleter', SHEET_TYPE, SHEET_TYPE, {
      delete: {
        type: AttributeType.CELL_RANGE_COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCellRangeCollection(attributeValue)) {
            return;
          }

          for (const cellRange of attributeValue.value) {
            const semanticCellRange = new SemanticCellRange(cellRange);
            if (!isSemanticColumn(semanticCellRange)) {
              accept('error', 'An entire column needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          }
        },
      },
    });
  }
}
