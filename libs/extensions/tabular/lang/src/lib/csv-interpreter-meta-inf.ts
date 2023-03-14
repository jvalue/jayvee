import {
  AttributeValueType,
  BlockMetaInformation,
  IOType,
} from '@jvalue/language-server';

export class CSVInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'CSVInterpreter',
      // Attribute definitions:
      {
        delimiter: {
          type: AttributeValueType.TEXT,
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
      // Input type:
      IOType.FILE,

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
