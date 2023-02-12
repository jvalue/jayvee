import {
  AttributeType,
  BlockMetaInformation,
  FILE_SYSTEM_TYPE,
  FILE_TYPE,
} from '@jayvee/language-server';

export class FilePickerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'FilePicker',

      // Input type:
      FILE_SYSTEM_TYPE,

      // Output type:
      FILE_TYPE,

      // Attribute definitions:
      {
        path: {
          type: AttributeType.STRING,
        },
      },
    );
  }
}
