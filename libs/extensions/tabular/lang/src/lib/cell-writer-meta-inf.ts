import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  affectsSingleCell,
  convertToIndices,
  isCellRangeValue,
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
          const indices = convertToIndices(attributeValue.value);
          if (indices === undefined) {
            return;
          }

          if (!affectsSingleCell(indices)) {
            accept('error', 'A single cell needs to be selected', {
              node: attributeValue,
            });
          }
        },
      },
    });
  }
}
