import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isCollection,
  isSemanticColumn,
  validateTypedCollection,
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

          const { validItems, invalidItems } = validateTypedCollection(
            attributeValue,
            isCellRangeValue,
          );

          invalidItems.forEach((invalidValue) =>
            accept('error', 'Only cell ranges are allowed in this collection', {
              node: invalidValue,
            }),
          );

          for (const collectionValue of validItems) {
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
