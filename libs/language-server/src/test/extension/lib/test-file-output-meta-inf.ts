// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation, IOType } from '../../../lib';

export class TestFileOutputMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'TestFileOutput',

      // Property definitions:
      {},
      // Input type:
      IOType.NONE,

      // Output type:
      IOType.FILE,
    );
    this.docs.description = 'Test block that outputs a IOType.FILE';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description: 'Example',
      },
    ];
  }
}

const blockExampleUsage = `block TestExtractor oftype TestFileOutput {
}`;
