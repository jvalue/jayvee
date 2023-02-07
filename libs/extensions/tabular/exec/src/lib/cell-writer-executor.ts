import { strict as assert } from 'assert';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet, columnIndexAsCharacters } from '@jayvee/language-server';

import {
  cellRangeIndicesFitSheet,
  replaceLastIndex,
} from './cell-range-indices-util';

export class CellWriterExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('CellWriter');
  }

  override execute(input: Sheet): Promise<R.Result<Sheet>> {
    const at = this.getCellRangeAttributeValue('at');
    const write = this.getStringAttributeValue('write');

    if (!cellRangeIndicesFitSheet(at, input)) {
      return Promise.resolve(
        R.err({
          message: 'The specified cell does not exist in the sheet',
          diagnostic: { node: this.getOrFailAttribute('at').value },
        }),
      );
    }

    const replacedIndices = replaceLastIndex(at, input);
    assert(
      replacedIndices.from.row === replacedIndices.to.row &&
        replacedIndices.from.column === replacedIndices.to.column,
    );
    const rowIndex = replacedIndices.from.row;
    const columnIndex = replacedIndices.from.column;

    this.logger.logDebug(
      `Writing "${write}" at cell ${columnIndexAsCharacters(columnIndex)}${
        rowIndex + 1
      }`,
    );

    const resultingSheet = { ...input };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resultingSheet.data[rowIndex]![columnIndex] = write;
    return Promise.resolve(R.ok(resultingSheet));
  }
}
