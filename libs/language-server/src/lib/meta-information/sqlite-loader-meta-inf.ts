import { SQLiteLoader } from '../ast/generated/ast';
import { TABLE_TYPE, Table, UNDEFINED_TYPE } from '../types/io-types';

import { BlockMetaInformation } from './block-meta-inf';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation<
  SQLiteLoader,
  Table,
  void
> {
  constructor(block: SQLiteLoader) {
    super(block, TABLE_TYPE, UNDEFINED_TYPE);
  }
}
