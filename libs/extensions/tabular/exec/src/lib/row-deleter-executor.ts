import { strict as assert } from 'assert';

import * as R from '@jayvee/execution';
import { BlockExecutor, Sheet } from '@jayvee/execution';
import {
  IOType,
  RowWrapper,
  getRowIndex,
  isRowWrapper,
  rowIndexToString,
} from '@jayvee/language-server';

export class RowDeleterExecutor extends BlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  constructor() {
    super('RowDeleter', IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeRows = this.getCellRangeCollectionAttributeValue('delete');
    assert(relativeRows.every(isRowWrapper));

    let absoluteRows = relativeRows.map((row) =>
      inputSheet.resolveRelativeIndexes(row),
    );

    for (const row of absoluteRows) {
      if (!inputSheet.isInBounds(row)) {
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

    const resultingSheet = inputSheet.clone();
    absoluteRows.forEach((row) => {
      resultingSheet.deleteRow(row);
    });

    return R.ok(resultingSheet);
  }

  private sortByRowIndex(rows: RowWrapper[]): void {
    rows.sort(
      (firstRow, secondRow) => getRowIndex(firstRow) - getRowIndex(secondRow),
    );
  }

  private removeDuplicateRows(rows: RowWrapper[]): RowWrapper[] {
    return rows.reduce<RowWrapper[]>((previous, row, index) => {
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
