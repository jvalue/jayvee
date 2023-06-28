// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class FilePickerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'FilePicker',

      // Property definitions:
      {
        path: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description:
              'The path of the file to select, relative to the root of the provided `FileSystem`.',
          },
        },
      },
      // Input type:
      IOType.FILE_SYSTEM,

      // Output type:
      IOType.FILE,
    );

    this.docs.description =
      'Selects one `File` from a `FileSystem` based on its relative path to the root of the `FileSystem`. If no file matches the relative path, no output is created and the execution of the pipeline is aborted.';
    this.docs.examples = [
      {
        code: `block AgencyFilePicker oftype FilePicker {
  path: "/agency.txt";
}`,
        description:
          'Tries to pick the file `agency.txt` from the root of the provided `FileSystem`. If `agency.txt` exists it is passed on as `File`, if it does not exist the execution of the pipeline is aborted.',
      },
    ];
  }
}
