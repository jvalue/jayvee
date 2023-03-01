import {
  AttributeValueType,
  BlockMetaInformation,
  IOType,
} from '@jayvee/language-server';

export class ArchiveInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'ArchiveInterpreter',

      // Input type:
      IOType.FILE,

      // Output type:
      IOType.FILE_SYSTEM,

      // Attribute definitions:
      {
        archiveType: {
          type: AttributeValueType.TEXT,
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
