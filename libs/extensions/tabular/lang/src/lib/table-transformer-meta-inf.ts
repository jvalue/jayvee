// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class TableTransformerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TableTransformer',
      {
        inputColumn: {
          type: PrimitiveValuetypes.Text,
        },
        outputColumn: {
          type: PrimitiveValuetypes.Text,
        },
        use: {
          type: PrimitiveValuetypes.Transform,
        },
      },
      IOType.TABLE,
      IOType.TABLE,
    );
  }
}
