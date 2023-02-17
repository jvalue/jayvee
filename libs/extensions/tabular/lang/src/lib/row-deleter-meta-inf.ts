import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeCollection,
  isSemanticRow,
} from '@jayvee/language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('RowDeleter', SHEET_TYPE, SHEET_TYPE, {
      delete: {
        type: AttributeType.CELL_RANGE_COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCellRangeCollection(attributeValue)) {
            return;
          }

          for (const cellRange of attributeValue.value) {
            if (!SemanticCellRange.canBeWrapped(cellRange)) {
              continue;
            }
            const semanticCellRange = new SemanticCellRange(cellRange);
            if (!isSemanticRow(semanticCellRange)) {
              accept('error', 'An entire row needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          }
        },
      },
    });
  }
}
