// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation, IOType } from '../../../lib';

export class TestTableLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'TestTableLoader',
      // Property definitions:
      {},
      // Input type:
      IOType.TABLE,
      // Output type:
      IOType.NONE,
    );
  }
}
