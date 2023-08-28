// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation, IOType } from '@jvalue/jayvee-language-server';

export class XLSXInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'XLSXInterpreter',
      // Property definitions:
      {},
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.WORKBOOK,
    );

    this.docs.description =
      'Interprets an input file as a XLSX-file and outputs a `Workbook` containing `Sheet`s.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Interprets an input file as a XLSX-file and outputs a `Workbook` containing `Sheet`s.',
      },
    ];
  }
}
const blockExample = `block AgencyXLSXInterpreter oftype XLSXInterpreter {  
  }`;
