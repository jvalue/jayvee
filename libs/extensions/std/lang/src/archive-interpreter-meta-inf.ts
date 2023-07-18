// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class ArchiveInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'ArchiveInterpreter',

      // Property definitions:
      {
        archiveType: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The archive type to be interpreted, e.g., `"zip" or "gz`.',
          },
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.FILE_SYSTEM,
    );
    this.docs.description =
      'Interprets a `File` as an archive file and converts it to a `FileSystem`. The archive file root is considered the root of the `FileSystem`.';

    this.docs.examples = [
      {
        code: `block ZipArchiveInterpreter oftype ArchiveInterpreter {
  archiveType: "zip";
}`,
        description:
          'Interprets a `File` as a ZIP-archive and creates a `FileSystem` of its extracted contents.',
      },
    ];
  }
}
