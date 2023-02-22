import { strict as assert } from 'assert';

import { BlockExecutor, Sheet } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import {
  ColumnWrapper,
  columnIndexToString,
  getColumnIndex,
  isColumnWrapper,
} from '@jayvee/language-server';

import {
  clone,
  deleteColumn,
  isInBounds,
  resolveRelativeIndexes,
} from './sheet-util';

export class ColumnDeleterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('ColumnDeleter');
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeColumns = this.getCellRangeCollectionAttributeValue('delete');
    assert(relativeColumns.every(isColumnWrapper));

    let absoluteColumns = relativeColumns.map((column) =>
      resolveRelativeIndexes(inputSheet, column),
    );

    for (const column of absoluteColumns) {
      if (!isInBounds(inputSheet, column)) {
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

    this.logger.logDebug(
      `Deleting column(s) ${absoluteColumns
        .map(getColumnIndex)
        .map(columnIndexToString)
        .join(', ')}`,
    );

    // By reversing the order, the column indexes stay stable during deletion
    absoluteColumns.reverse();

    const resultingSheet = clone(inputSheet);
    absoluteColumns.forEach((column) => {
      deleteColumn(resultingSheet, column);
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
