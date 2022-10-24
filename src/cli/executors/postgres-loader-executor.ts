import { PostgresLoader } from '../../language-server/generated/ast';
import { Table, tableType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';

export class PostgresLoaderExecutor extends BlockExecutor<PostgresLoader> {
  constructor(block: PostgresLoader) {
    super(block, tableType, undefinedType);
  }

  override execute(input: Table): void {
    // TODO #10
    console.log(input);
  }
}
