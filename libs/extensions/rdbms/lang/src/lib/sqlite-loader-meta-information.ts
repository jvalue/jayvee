import {
  AttributeType,
  BlockMetaInformation,
  IOType,
} from '@jayvee/language-server';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super('SQLiteLoader', IOType.TABLE, IOType.NONE, {
      table: {
        type: AttributeType.STRING,
        docs: {
          description: 'The name of the table to write into.',
        },
      },
      file: {
        type: AttributeType.STRING,
        docs: {
          description:
            'The path to the SQLite file that will be created. Usual file extensions are `.sqlite` and `.db`.',
        },
      },
    });
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
