import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  affectsEntireColumn,
  convertToIndices,
  isCellRangeCollection,
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
            const indices = convertToIndices(cellRange);
            if (indices === undefined) {
              continue;
            }

            if (!affectsEntireColumn(indices)) {
              accept('error', 'An entire column needs to be selected', {
                node: cellRange,
              });
            }
          }
        },
      },
    });
  }
}
