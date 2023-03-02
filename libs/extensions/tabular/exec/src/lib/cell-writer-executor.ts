import { strict as assert } from 'assert';

import * as R from '@jayvee/execution';
import { BlockExecutor, Sheet } from '@jayvee/execution';
import { IOType, getCellIndex, isCellWrapper } from '@jayvee/language-server';

export class CellWriterExecutor extends BlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  constructor() {
    super('CellWriter', IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Sheet>> {
    const relativeCell = this.getCellRangeAttributeValue('at');
    const content = this.getStringAttributeValue('write');

    assert(isCellWrapper(relativeCell));

    const absoluteCell = inputSheet.resolveRelativeIndexes(relativeCell);
    if (!inputSheet.isInBounds(absoluteCell)) {
      return R.err({
        message: 'The specified cell does not exist in the sheet',
        diagnostic: { node: absoluteCell.astNode },
      });
    }

    this.logger.logDebug(
      `Writing "${content}" at cell ${getCellIndex(absoluteCell).toString()}`,
    );

    const resultingSheet = inputSheet.clone();
    resultingSheet.writeCell(absoluteCell, content);

    return R.ok(resultingSheet);
  }
}
