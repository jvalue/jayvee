import * as R from '@jvalue/execution';
import { BlockExecutor, Sheet } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

export class CellRangeSelectorExecutor extends BlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  constructor() {
    super('CellRangeSelector', IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeRange = this.getCellRangeAttributeValue('select');

    const absoluteRange = inputSheet.resolveRelativeIndexes(relativeRange);

    if (!inputSheet.isInBounds(absoluteRange)) {
      return R.err({
        message: 'The specified cell range does not fit the sheet',
        diagnostic: { node: absoluteRange.astNode },
      });
    }

    this.logger.logDebug(`Selecting cell range ${absoluteRange.toString()}`);

    const resultingSheet = inputSheet.clone();
    resultingSheet.selectRange(absoluteRange);

    return R.ok(resultingSheet);
  }
}
