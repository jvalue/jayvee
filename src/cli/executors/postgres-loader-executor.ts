import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';

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

  override executeFn(input: Table): TE.TaskEither<ExecutionError, void> {
    // TODO #10
    console.log(input);
    return () => Promise.resolve(E.right(undefined));
  }
}
