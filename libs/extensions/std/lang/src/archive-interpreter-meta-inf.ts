import {
  AttributeValueType,
  BlockMetaInformation,
  IOType,
} from '@jvalue/language-server';

export class ArchiveInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'ArchiveInterpreter',

      // Attribute definitions:
      {
        archiveType: {
          type: AttributeValueType.TEXT,
          docs: {
            description: 'The archive type to be interpreted, e.g., `"zip"`.',
          },
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.FILE_SYSTEM,
    );
    this.docs.description =
      'Interprets an archive file of type `File` as a `FileSystem`.';
  }
}
