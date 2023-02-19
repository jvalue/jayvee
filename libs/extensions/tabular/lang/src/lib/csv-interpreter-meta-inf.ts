import {
  AttributeType,
  BlockMetaInformation,
  FILE_TYPE,
  SHEET_TYPE,
} from '@jayvee/language-server';

export class CSVInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'CSVInterpreter',

      // Input type:
      FILE_TYPE,

      // Output type:
      SHEET_TYPE,

      // Attribute definitions:
      {
        delimiter: {
          type: AttributeType.STRING,
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
      },
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
