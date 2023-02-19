import {
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
      {},
    );

    this.docs.description = 'Interprets an input file as a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Interprets an input file coming from an GTFS-file-collection as a `Sheet`.',
      },
    ];
  }
}
const blockExample = `block AgencyCSVInterpreter oftype CSVInterpreter {  

  }`;
