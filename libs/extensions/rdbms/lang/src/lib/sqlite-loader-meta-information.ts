import {
  AttributeType,
  BlockMetaInformation,
  TABLE_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super('SQLiteLoader', TABLE_TYPE, UNDEFINED_TYPE, {
      table: {
        type: AttributeType.STRING,
        docs: {
          description: 'The table to write into.',
        },
      },
      file: {
        type: AttributeType.STRING,
        docs: {
          description: 'The path to the SQLite file that is created.',
        },
      },
    });
    this.docs.description = 'Loads a `Table` into a SQLite database sink.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'A local SQLite file at the given path is created and filled with the cars table data.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsLoader oftype SQLiteLoader {
  table: "Cars";
  file: "./cars.db";
}`;
