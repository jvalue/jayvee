import { Table, tableType, undefinedType } from '../data-types/data-types';
import { PostgresLoader } from '../generated/ast';

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
