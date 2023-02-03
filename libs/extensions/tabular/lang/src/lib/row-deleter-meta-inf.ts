import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  affectsEntireRow,
  convertToIndices,
  isCellRangeCollection,
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
            const indices = convertToIndices(cellRange);
            if (indices === undefined) {
              continue;
            }

            if (!affectsEntireRow(indices)) {
              accept('error', 'An entire row needs to be selected', {
                node: cellRange,
              });
            }
          }
        },
      },
    });
  }
}
