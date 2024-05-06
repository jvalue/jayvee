// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  type ColumnWrapper,
  IOType,
  columnIndexToString,
  getColumnIndex,
  isColumnWrapper,
} from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class ColumnDeleterExecutor extends AbstractBlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  public static readonly type = 'ColumnDeleter';

  constructor() {
    super(IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeColumns = context
      .getPropertyValue(
        'delete',
        context.valueTypeProvider.createCollectionValueTypeOf(
          context.valueTypeProvider.Primitives.CellRange,
        ),
      )
      .map((astNode) => context.wrapperFactories.CellRange.wrap(astNode));
    assert(relativeColumns.every(isColumnWrapper));

    let absoluteColumns = relativeColumns.map((column) =>
      inputSheet.resolveRelativeIndexes(column),
    );

    for (const column of absoluteColumns) {
      if (!inputSheet.isInBounds(column)) {
        const columnIndex = getColumnIndex(column);
        return R.err({
          message: `The specified column ${columnIndexToString(
            columnIndex,
          )} does not exist in the sheet`,
          diagnostic: { node: column.astNode },
        });
      }
    }

    // Required for removing duplicates in the next step
    this.sortByColumnIndex(absoluteColumns);

    // That way, the upcoming deletion is only called once per individual column
    absoluteColumns = this.removeDuplicateColumns(absoluteColumns);

    context.logger.logDebug(
      `Deleting column(s) ${absoluteColumns
        .map(getColumnIndex)
        .map(columnIndexToString)
        .join(', ')}`,
    );

    // By reversing the order, the column indexes stay stable during deletion
    absoluteColumns.reverse();

    const resultingSheet = inputSheet.clone();
    absoluteColumns.forEach((column) => {
      resultingSheet.deleteColumn(column);
    });

    return R.ok(resultingSheet);
  }

  private sortByColumnIndex(columns: ColumnWrapper[]): void {
    columns.sort(
      (columnA, columnB) => getColumnIndex(columnA) - getColumnIndex(columnB),
    );
  }

  private removeDuplicateColumns(columns: ColumnWrapper[]): ColumnWrapper[] {
    return columns.reduce<ColumnWrapper[]>((previous, column, index) => {
      const previousColumn = previous[index - 1];
      if (previousColumn !== undefined) {
        if (getColumnIndex(previousColumn) === getColumnIndex(column)) {
          // The current column is a duplicate because it has the same index as the previous column
          return previous;
        }
      }
      return [...previous, column];
    }, []);
  }
}
