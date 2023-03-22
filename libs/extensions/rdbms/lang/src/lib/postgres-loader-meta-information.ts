import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/language-server';

export class PostgresLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'PostgresLoader',
      {
        host: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The hostname or IP address of the Postgres database.',
          },
        },
        port: {
          type: PropertyValuetype.INTEGER,
          docs: {
            description: 'The port of the Postgres database.',
          },
        },
        username: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The username to login to the Postgres database.',
          },
        },
        password: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The password to login to the Postgres database.',
          },
        },
        database: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: 'The database to use.',
          },
        },
        table: {
          type: PropertyValuetype.TEXT,
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
  port: "5432";
  username: "postgres";
  password: "postgres";
  database: "CarsDB";
  table: "Cars";
}`;
