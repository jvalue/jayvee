import { PostgresLoader } from '../generated/ast';
import { TABLE_TYPE, Table, UNDEFINED_TYPE } from '../types';

import { BlockMetaInformation } from './block-meta-inf';

export class PostgresLoaderMetaInformation extends BlockMetaInformation<
  PostgresLoader,
  Table,
  void
> {
  constructor(block: PostgresLoader) {
    super(block, TABLE_TYPE, UNDEFINED_TYPE);
  }
}
