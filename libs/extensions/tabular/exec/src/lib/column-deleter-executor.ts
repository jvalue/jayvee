import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet, columnIndexAsCharacters } from '@jayvee/language-server';

import {
  cellRangeIndicesFitSheet,
  replaceLastIndex,
} from './cell-range-indices-util';

export class ColumnDeleterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('ColumnDeleter');
  }

  override execute(input: Sheet): Promise<R.Result<Sheet>> {
    const deleteCollection =
      this.getCellRangeCollectionAttributeValue('delete');

    for (const cellRangeIndices of deleteCollection) {
      if (!cellRangeIndicesFitSheet(cellRangeIndices, input)) {
        return Promise.resolve(
          R.err({
            message: `The specified column ${columnIndexAsCharacters(
              cellRangeIndices.from.column,
            )} does not exist in the sheet`,
            diagnostic: { node: this.getOrFailAttribute('delete').value },
          }),
        );
      }
    }

    const columnsToDelete = deleteCollection
      .map((indices) => replaceLastIndex(indices, input))
      .map((indices) => indices.from.column);
    const uniqueColumnsToDelete = [...new Set(columnsToDelete)].sort();

    this.logger.logDebug(
      `Deleting column(s) ${uniqueColumnsToDelete
        .map(columnIndexAsCharacters)
        .join(', ')}`,
    );

    const resultingSheet = { ...input };

    resultingSheet.data.forEach((row) => {
      uniqueColumnsToDelete.reverse().forEach((columnIndex) => {
        row.splice(columnIndex, 1);
      });
    });
    resultingSheet.width -= uniqueColumnsToDelete.length;
    return Promise.resolve(R.ok(resultingSheet));
  }
}
