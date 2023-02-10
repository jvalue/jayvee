import { strict as assert } from 'assert';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import {
  SemanticColumn,
  Sheet,
  columnIndexToString,
  getColumnIndex,
  isSemanticColumn,
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

  override execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeColumns = this.getCellRangeCollectionAttributeValue('delete');
    assert(relativeColumns.every(isSemanticColumn));

    let absoluteColumns = relativeColumns.map((column) =>
      resolveRelativeIndexes(inputSheet, column),
    );

    for (const column of absoluteColumns) {
      if (!isInBounds(inputSheet, column)) {
        const columnIndex = getColumnIndex(column);
        return Promise.resolve(
          R.err({
            message: `The specified column ${columnIndexToString(
              columnIndex,
            )} does not exist in the sheet`,
            diagnostic: { node: column.astNode },
          }),
        );
      }
    }

    // Sort columns ascending by column index, required for removing duplicates in the next step
    absoluteColumns.sort(
      (columnA, columnB) => getColumnIndex(columnA) - getColumnIndex(columnB),
    );

    // Remove duplicate columns, so the deletion is only called once per individual column
    absoluteColumns = absoluteColumns.reduce<SemanticColumn[]>(
      (previous, column, index) => {
        const previousColumn = previous[index - 1];
        if (previousColumn !== undefined) {
          if (getColumnIndex(previousColumn) === getColumnIndex(column)) {
            // The current column is a duplicate because it has the same index as the previous column
            return previous;
          }
        }
        return [...previous, column];
      },
      [],
    );

    this.logger.logDebug(
      `Deleting column(s) ${absoluteColumns
        .map(getColumnIndex)
        .map(columnIndexToString)
        .join(', ')}`,
    );

    // Reverse the column order, so the indexes are stable during deletion
    absoluteColumns.reverse();

    const resultingSheet = clone(inputSheet);
    absoluteColumns.forEach((column) => {
      deleteColumn(resultingSheet, column);
    });

    return Promise.resolve(R.ok(resultingSheet));
  }
}
