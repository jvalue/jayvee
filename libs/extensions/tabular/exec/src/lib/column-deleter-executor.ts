import { strict as assert } from 'assert';

import * as R from '@jvalue/execution';
import { BlockExecutor, ExecutionContext, Sheet } from '@jvalue/execution';
import {
  ColumnWrapper,
  IOType,
  columnIndexToString,
  getColumnIndex,
  isColumnWrapper,
} from '@jvalue/language-server';

export class ColumnDeleterExecutor
  implements BlockExecutor<IOType.SHEET, IOType.SHEET>
{
  public readonly blockType = 'ColumnDeleter';
  public readonly inputType = IOType.SHEET;
  public readonly outputType = IOType.SHEET;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeColumns =
      context.getCellRangeCollectionAttributeValue('delete');
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
