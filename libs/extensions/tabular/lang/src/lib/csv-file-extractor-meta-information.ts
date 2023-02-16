import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

export class CSVFileExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CSVFileExtractor', UNDEFINED_TYPE, SHEET_TYPE, {
      url: {
        type: AttributeType.STRING,
        docs: {
          description: 'The URL to the CSV file in the web to extract.',
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
              description: 'Commas are used to separate values in the CSV file.',
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
  url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
}`;
