import {
  AttributeType,
  BlockMetaInformation,
  FILE_SYSTEM_TYPE,
  FILE_TYPE,
} from '@jayvee/language-server';

export class ArchiveInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'ArchiveInterpreter',

      // Input type:
      FILE_TYPE,

      // Output type:
      FILE_SYSTEM_TYPE,

      // Attribute definitions:
      {
        archiveType: {
          type: AttributeType.STRING,
          docs: {
            description: 'The archive type to be interpreted, e.g., `"zip"`.',
          },
        },
      },
    );
    this.docs.description =
      'Interprets an archive file of type `File` as a `FileSystem`.';
  }
}
