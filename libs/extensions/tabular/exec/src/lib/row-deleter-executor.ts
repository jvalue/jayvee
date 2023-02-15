import { strict as assert } from 'assert';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import {
  SemanticRow,
  Sheet,
  getRowIndex,
  isSemanticRow,
  rowIndexToString,
} from '@jayvee/language-server';

import {
  clone,
  deleteRow,
  isInBounds,
  resolveRelativeIndexes,
} from './sheet-util';

export class RowDeleterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('RowDeleter');
  }

  override execute(inputSheet: Sheet): R.Result<Sheet> {
    const relativeRows = this.getCellRangeCollectionAttributeValue('delete');
    assert(relativeRows.every(isSemanticRow));

    let absoluteRows = relativeRows.map((row) =>
      resolveRelativeIndexes(inputSheet, row),
    );

    for (const row of absoluteRows) {
      if (!isInBounds(inputSheet, row)) {
        const rowIndex = getRowIndex(row);
        return R.err({
          message: `The specified row ${rowIndexToString(
            rowIndex,
          )} does not exist in the sheet`,
          diagnostic: { node: row.astNode },
        });
      }
    }

    // Required for removing duplicates in the next step
    this.sortByRowIndex(absoluteRows);

    // That way, the upcoming deletion is only called once per individual row
    absoluteRows = this.removeDuplicateRows(absoluteRows);

    this.logger.logDebug(
      `Deleting row(s) ${absoluteRows
        .map(getRowIndex)
        .map(rowIndexToString)
        .join(', ')}`,
    );

    // By reversing the order, the row indexes stay stable during deletion
    absoluteRows.reverse();

    const resultingSheet = clone(inputSheet);
    absoluteRows.forEach((row) => {
      deleteRow(resultingSheet, row);
    });

    return R.ok(resultingSheet);
  }

  private sortByRowIndex(rows: SemanticRow[]): void {
    rows.sort(
      (firstRow, secondRow) => getRowIndex(firstRow) - getRowIndex(secondRow),
    );
  }

  private removeDuplicateRows(rows: SemanticRow[]): SemanticRow[] {
    return rows.reduce<SemanticRow[]>((previous, row, index) => {
      const previousRow = previous[index - 1];
      if (previousRow !== undefined) {
        if (getRowIndex(previousRow) === getRowIndex(row)) {
          // The current row is a duplicate because it has the same index as the previous row
          return previous;
        }
      }
      return [...previous, row];
    }, []);
  }
}
