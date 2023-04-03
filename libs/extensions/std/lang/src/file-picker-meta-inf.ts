// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/jayvee-language-server';

export class FilePickerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'FilePicker',

      // Property definitions:
      {
        path: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The path of the file to get',
          },
        },
      },
      // Input type:
      IOType.FILE_SYSTEM,

      // Output type:
      IOType.FILE,
    );

    this.docs.description = 'Picks an File out of an FileSystem and outputs it';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'The block receives a Filesystem and gets the file specified in path-property',
      },
    ];
  }
}

const blockExampleUsage = `block AgencyFilePicker oftype FilePicker {
  path: "./Agencies.txt";
}`;
