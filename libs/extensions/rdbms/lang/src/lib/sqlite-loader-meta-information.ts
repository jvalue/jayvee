// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'SQLiteLoader',
      {
        table: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The name of the table to write into.',
          },
        },
        file: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description:
              'The path to a SQLite file that will be created if it does not exist. Usual file extensions are `.sqlite` and `.db`.',
          },
        },
        dropTable: {
          type: PrimitiveValuetypes.Boolean,
          defaultValue: true,
          docs: {
            description:
              'Indicates, whether to drop the table before loading data into it. If `false`, data is appended to the table instead of dropping it.',
          },
        },
      },
      IOType.TABLE,
      IOType.NONE,
    );
    this.docs.description = 'Loads a `Table` into a SQLite database sink.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'A SQLite file `cars.db` is created in the working directory. Incoming data is written to the table `cars`.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsLoader oftype SQLiteLoader {
  table: "cars";
  file: "./cars.db";
}`;
