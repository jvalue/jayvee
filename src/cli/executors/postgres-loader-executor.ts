import * as E from 'fp-ts/lib/Either';

import { PostgresLoader } from '../../language-server/generated/ast';
import { Table, tableType, undefinedType } from '../data-types';

import { BlockExecutor, ExecutionError } from './block-executor';

export class PostgresLoaderExecutor extends BlockExecutor<
  PostgresLoader,
  Table,
  void
> {
  constructor(block: PostgresLoader) {
    super(block, tableType, undefinedType);
  }

  override execute(input: Table): Promise<E.Either<void, ExecutionError>> {
    // TODO #10
    console.log(input);
    return Promise.resolve(E.left(undefined));
  }
}
