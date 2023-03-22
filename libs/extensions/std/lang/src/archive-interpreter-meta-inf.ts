import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/language-server';

export class ArchiveInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'ArchiveInterpreter',

      // Property definitions:
      {
        archiveType: {
          type: PropertyValuetype.TEXT,
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
