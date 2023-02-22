import { BlockExecutor, Sheet } from '@jayvee/execution';
import * as R from '@jayvee/execution';

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

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeRange = this.getCellRangeAttributeValue('select');

    const absoluteRange = resolveRelativeIndexes(inputSheet, relativeRange);

    if (!isInBounds(inputSheet, absoluteRange)) {
      return R.err({
        message: 'The specified cell range does not fit the sheet',
        diagnostic: { node: absoluteRange.astNode },
      });
    }

    this.logger.logDebug(`Selecting cell range ${absoluteRange.toString()}`);

    const resultingSheet = clone(inputSheet);
    selectRange(resultingSheet, absoluteRange);

    return R.ok(resultingSheet);
  }
}
