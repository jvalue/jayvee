import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

import {
  clone,
  isInBounds,
  resolveRelativeIndexes,
  selectRange,
} from './sheet-util';

export class CellRangeSelectorExecutor extends BlockExecutor<Sheet, Sheet> {
  constructor() {
    super('CellRangeSelector');
  }

  override execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeRange = this.getCellRangeAttributeValue('select');

    const absoluteRange = resolveRelativeIndexes(inputSheet, relativeRange);

    if (!isInBounds(inputSheet, absoluteRange)) {
      return Promise.resolve(
        R.err({
          message: 'The specified cell range does not fit the sheet',
          diagnostic: { node: absoluteRange.astNode },
        }),
      );
    }

    this.logger.logDebug(`Selecting cell range ${absoluteRange.toString()}`);

    const resultingSheet = clone(inputSheet);
    selectRange(resultingSheet, absoluteRange);

    return Promise.resolve(R.ok(resultingSheet));
  }
}
