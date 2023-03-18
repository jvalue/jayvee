import * as R from '@jvalue/execution';
import { BlockExecutor, ExecutionContext, Sheet } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

export class CellRangeSelectorExecutor
  implements BlockExecutor<IOType.SHEET, IOType.SHEET>
{
  public readonly blockType = 'CellRangeSelector';
  public readonly inputType = IOType.SHEET;
  public readonly outputType = IOType.SHEET;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeRange = context.getCellRangeAttributeValue('select');

    const absoluteRange = inputSheet.resolveRelativeIndexes(relativeRange);

    if (!inputSheet.isInBounds(absoluteRange)) {
      return R.err({
        message: 'The specified cell range does not fit the sheet',
        diagnostic: { node: absoluteRange.astNode },
      });
    }

    context.logger.logDebug(`Selecting cell range ${absoluteRange.toString()}`);

    const resultingSheet = inputSheet.clone();
    resultingSheet.selectRange(absoluteRange);

    return R.ok(resultingSheet);
  }
}
