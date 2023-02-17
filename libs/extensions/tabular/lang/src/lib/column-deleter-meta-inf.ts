import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isCollection,
  isSemanticColumn,
} from '@jayvee/language-server';

export class ColumnDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('ColumnDeleter', SHEET_TYPE, SHEET_TYPE, {
      delete: {
        type: AttributeType.COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCollection(attributeValue)) {
            return;
          }

          for (const collectionValue of attributeValue.values) {
            if (!isCellRangeValue(collectionValue)) {
              accept(
                'error',
                'Only cell ranges are allowed in this collection',
                {
                  node: collectionValue,
                },
              );
              continue;
            }

            if (!SemanticCellRange.canBeWrapped(collectionValue.value)) {
              continue;
            }
            const semanticCellRange = new SemanticCellRange(
              collectionValue.value,
            );
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
