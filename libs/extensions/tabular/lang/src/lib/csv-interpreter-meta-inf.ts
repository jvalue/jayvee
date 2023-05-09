// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class CSVInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'CSVInterpreter',
      // Property definitions:
      {
        delimiter: {
          type: PrimitiveValuetypes.Text,
          defaultValue: ',',
          docs: {
            description: 'The delimiter for values in the CSV file.',
            examples: [
              {
                code: 'delimiter: ","',
                description:
                  'Commas are used to separate values in the CSV file.',
              },
            ],
          },
        },
        enclosing: {
          type: PrimitiveValuetypes.Text,
          defaultValue: '',
          docs: {
            description:
              'The enclosing character that may be used for values in the CSV file.',
          },
        },
        enclosingEscape: {
          type: PrimitiveValuetypes.Text,
          defaultValue: '',
          docs: {
            description:
              'The character to escape enclosing characters in values.',
          },
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.SHEET,
    );

    this.docs.description =
      'Interprets an input file as a csv-file containing string-values delimited by `delimiter` and outputs a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Interprets an input file as a csv-file containing string-values delimited by `;` and outputs `Sheet`.',
      },
    ];
  }
}
const blockExample = `block AgencyCSVInterpreter oftype CSVInterpreter {  
    delimiter: ";"
  }`;
