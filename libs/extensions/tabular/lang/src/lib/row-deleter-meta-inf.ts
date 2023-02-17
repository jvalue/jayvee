import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isCollection,
  isSemanticRow,
  validateTypedCollection,
} from '@jayvee/language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('RowDeleter', SHEET_TYPE, SHEET_TYPE, {
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
