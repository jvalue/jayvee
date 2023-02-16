import {
  AttributeType,
  BlockMetaInformation,
  FILE_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

export class HttpExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'HttpExtractor',

      // Input type:
      UNDEFINED_TYPE,

      // Output type:
      FILE_TYPE,

      // Attribute definitions:
      {
        url: {
          type: AttributeType.STRING,
          docs: {
            description: 'The URL to the file in the web to extract.',
          },
        },
      },
    );
    this.docs.description = 'Extracts a `File` from the web.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description: 'Fetches a CSV file from the given URL.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsFileExtractor oftype HttpExtractor {
  url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
}`;
