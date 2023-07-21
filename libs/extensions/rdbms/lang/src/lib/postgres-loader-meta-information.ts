// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class PostgresLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'PostgresLoader',
      {
        host: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The hostname or IP address of the Postgres database.',
          },
        },
        port: {
          type: PrimitiveValuetypes.Integer,
          docs: {
            description: 'The port of the Postgres database.',
          },
        },
        username: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The username to login to the Postgres database.',
          },
        },
        password: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The password to login to the Postgres database.',
          },
        },
        database: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The database to use.',
          },
        },
        table: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The name of the table to write into.',
          },
        },
      },
      IOType.TABLE,
      IOType.NONE,
    );
    this.docs.description = 'Loads a `Table` into a PostgreSQL database sink.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'A local Postgres instance is filled with table data about cars.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsLoader oftype PostgresLoader {
  host: "localhost";
  port: 5432;
  username: "postgres";
  password: "postgres";
  database: "CarsDB";
  table: "Cars";
}`;
