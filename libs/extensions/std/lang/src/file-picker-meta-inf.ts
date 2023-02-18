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
          docs: {
            description: 'The path of the file to get',
          },
        },
      },
    );

    this.docs.description = 'Picks an File out of an FileSystem and outputs it';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'The block receives a Filesystem and gets the file specified in path-attribute',
      },
    ];
  }
}

const blockExampleUsage = `block AgencyFilePicker oftype FilePicker {
  path: "./Agencies.txt";
}`;
