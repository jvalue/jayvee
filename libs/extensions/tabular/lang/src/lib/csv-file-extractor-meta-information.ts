import {
  AttributeType,
  BlockMetaInformation,
  IOType,
} from '@jayvee/language-server';

export class CSVFileExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CSVFileExtractor', IOType.UNDEFINED, IOType.SHEET, {
      url: {
        type: AttributeType.STRING,
        docs: {
          description: 'The URL to the CSV file in the web to extract.',
          examples: [
            {
              code: 'url: "tinyurl.com/4ub9spwz"',
              description: 'Specifies the URL to fetch the data from.',
            },
          ],
        },
      },
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
    });

    this.docs.description =
      'Fetches a CSV file from the web and interprets it as a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Fetches a CSV file about cars from given URL and interprets it as a `Sheet`.',
      },
    ];
  }
}

const blockExample = `block CarsExtractor oftype CSVFileExtractor {  
  url: "tinyurl.com/4ub9spwz";
}`;
