// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation, IOType } from '../../../lib';

export class TestTableInputMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'TestTableInput',
      // Property definitions:
      {},
      // Input type:
      IOType.TABLE,
      // Output type:
      IOType.NONE,
    );
    this.docs.description = 'Test block that requires an input of IOType.TABLE';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description: 'Example',
      },
    ];
  }
}

const blockExampleUsage = `block TestLoader oftype TestTableInput {
}`;
