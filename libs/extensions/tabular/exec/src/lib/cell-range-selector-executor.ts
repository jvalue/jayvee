import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet, columnIndexAsCharacters } from '@jayvee/language-server';

import {
  cellRangeIndicesFitSheet,
  replaceLastIndex,
} from './cell-range-indices-util';

export class CellRangeSelectorExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('CellRangeSelector');
  }

  override execute(input: Sheet): Promise<R.Result<Sheet>> {
    const select = this.getCellRangeAttributeValue('select');

    if (!cellRangeIndicesFitSheet(select, input)) {
      return Promise.resolve(
        R.err({
          message: 'The specified cell range does not fit the sheet',
          diagnostic: { node: this.getOrFailAttribute('select').value },
        }),
      );
    }

    const replacedIndices = replaceLastIndex(select, input);

    this.logger.logDebug(
      `Selecting cell range ${columnIndexAsCharacters(
        replacedIndices.from.column,
      )}${replacedIndices.from.row + 1}:${columnIndexAsCharacters(
        replacedIndices.to.column,
      )}${replacedIndices.to.row + 1}`,
    );

    const resultingSheet = { ...input };
    resultingSheet.data = resultingSheet.data.reduce<string[][]>(
      (previous, row, rowIndex) => {
        if (
          rowIndex < replacedIndices.from.row ||
          replacedIndices.to.row < rowIndex
        ) {
          return previous;
        }
        return [
          ...previous,
          row.slice(replacedIndices.from.column, replacedIndices.to.column + 1),
        ];
      },
      [],
    );
    resultingSheet.width =
      replacedIndices.to.column - replacedIndices.from.column + 1;
    resultingSheet.height =
      replacedIndices.to.row - replacedIndices.from.row + 1;

    return Promise.resolve(R.ok(resultingSheet));
  }
}
