import { PostgresLoader } from '../generated/ast';
import { Table, tableType, undefinedType } from '../types';

import { BlockMetaInformation } from './block-meta-inf';

export class PostgresLoaderMetaInformation extends BlockMetaInformation<
  PostgresLoader,
  Table,
  void
> {
  constructor(block: PostgresLoader) {
    super(block, tableType, undefinedType);
  }
}
