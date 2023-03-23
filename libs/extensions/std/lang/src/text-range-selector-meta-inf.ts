import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/language-server';

export class TextRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextRangeSelector',
      {
        lineFrom: {
          type: PropertyValuetype.INTEGER,
          defaultValue: 1,
        },
        lineTo: {
          type: PropertyValuetype.INTEGER,
          defaultValue: Number.POSITIVE_INFINITY,
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Selects a range of lines from a `TextFile`.';
  }
}
