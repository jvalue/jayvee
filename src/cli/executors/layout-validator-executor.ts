import { LayoutValidator } from '../../language-server/generated/ast';
import { Sheet, Table, sheetType, tableType } from '../data-types';

import { BlockExecutor } from './block-executor';

export class LayoutValidatorExecutor extends BlockExecutor<
  LayoutValidator,
  Sheet,
  Table
> {
  constructor(block: LayoutValidator) {
    super(block, sheetType, tableType);
  }

  override execute(input: Sheet): Promise<Table> {
    // TODO #9
    return Promise.resolve({
      columnNames: ['col1', 'col2', 'col3'],
      data: input,
    });
  }
}
