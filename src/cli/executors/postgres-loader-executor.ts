import { PostgresLoader } from '../../language-server/generated/ast';
import { Table, tableType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class PostgresLoaderExecutor extends BlockExecutor<
  PostgresLoader,
  Table,
  void
> {
  constructor(block: PostgresLoader) {
    super(block, tableType, undefinedType);
  }

  override execute(input: Table): Promise<R.Result<void>> {
    // TODO #10
    console.log(input);
    return Promise.resolve(R.ok(undefined));
  }
}
