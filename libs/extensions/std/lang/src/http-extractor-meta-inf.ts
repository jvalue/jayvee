// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class HttpExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'HttpExtractor',

      // Property definitions:
      {
        url: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The URL to the file in the web to extract.',
            examples: [
              {
                code: 'url: "tinyurl.com/4ub9spwz"',
                description: 'Specifies the URL to fetch the data from.',
              },
            ],
          },
        },
        followRedirects: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
          docs: {
            description: 'Indicates, whether to follow redirects on get requests. If `false`, Redirects are disabled. Default `true`',
            examples: [
              {
                code: 'url: "tinyurl.com/4ub9spwz" \n followRedirects: true',
                description: 'Specifies the URL to fetch the data from and allows redirects.',
              },
            ],
          },
        },
      },

      // Input type:
      IOType.NONE,

      // Output type:
      IOType.FILE,
    );
    this.docs.description = 'Extracts a `File` from the web.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description: 'Fetches a file from the given URL.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsFileExtractor oftype HttpExtractor {
  url: "tinyurl.com/4ub9spwz";
}`;
