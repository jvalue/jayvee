import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

import {
  cellRangeIndicesFitSheet,
  replaceLastIndex,
} from './cell-range-indices-util';

export class RowDeleterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('RowDeleter');
  }

  override execute(input: Sheet): Promise<R.Result<Sheet>> {
    const deleteCollection =
      this.getCellRangeCollectionAttributeValue('delete');

    for (const cellRangeIndices of deleteCollection) {
      if (!cellRangeIndicesFitSheet(cellRangeIndices, input)) {
        return Promise.resolve(
          R.err({
            message: `The specified row ${
              cellRangeIndices.from.row + 1
            } does not exist in the sheet`,
            diagnostic: { node: this.getOrFailAttribute('delete').value },
          }),
        );
      }
    }

    const rowsToDelete = deleteCollection
      .map((indices) => replaceLastIndex(indices, input))
      .map((indices) => indices.from.row);
    const uniqueRowsToDelete = [...new Set(rowsToDelete)].sort();

    this.logger.logDebug(
      `Deleting row(s) ${uniqueRowsToDelete.map((row) => row + 1).join(', ')}`,
    );

    const resultingSheet = { ...input };

    uniqueRowsToDelete.reverse().forEach((rowIndex) => {
      resultingSheet.data.splice(rowIndex, 1);
    });
    resultingSheet.height -= uniqueRowsToDelete.length;
    return Promise.resolve(R.ok(resultingSheet));
  }
}
