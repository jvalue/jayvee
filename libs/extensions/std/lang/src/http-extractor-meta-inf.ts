import {
  AttributeType,
  BlockMetaInformation,
  FILE_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

export class HttpExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'HttpExtractor',

      // Input type:
      UNDEFINED_TYPE,

      // Output type:
      FILE_TYPE,

      // Attribute definitions:
      {
        url: {
          type: AttributeType.STRING,
        },
      },
    );
  }
}
