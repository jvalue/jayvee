// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/jayvee-language-server';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'SQLiteLoader',
      {
        table: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The name of the table to write into.',
          },
        },
        file: {
          type: PropertyValuetype.TEXT,
          docs: {
            description:
              'The path to the SQLite file that will be created. Usual file extensions are `.sqlite` and `.db`.',
          },
        },
        dropTable: {
          type: PropertyValuetype.BOOLEAN,
          docs: {
            description:
              'Indicates, wether to drop existing Tables before load. Can be used for appendig data by executing pipelines periodically.',
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
          'A local SQLite file is created at the given path and filled with table data about cars.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: "./cars.db";
}`;
