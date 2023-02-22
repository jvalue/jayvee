import {
  AttributeType,
  BlockMetaInformation,
  IOType,
} from '@jayvee/language-server';

export class FilePickerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'FilePicker',

      // Input type:
      IOType.FILE_SYSTEM,

      // Output type:
      IOType.FILE,

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
