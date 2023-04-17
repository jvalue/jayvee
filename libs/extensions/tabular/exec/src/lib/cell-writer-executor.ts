// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class CellWriterExecutor
  implements BlockExecutor<IOType.SHEET, IOType.SHEET>
{
  public static readonly type = 'CellWriter';
  public readonly inputType = IOType.SHEET;
  public readonly outputType = IOType.SHEET;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeCellRange = context.getCellRangePropertyValue('at');
    const textValues = context.getTextCollectionPropertyValue('write');

    assert(relativeCellRange.isOneDimensional());

    const absoluteCellRange =
      inputSheet.resolveRelativeIndexes(relativeCellRange);
    if (!inputSheet.isInBounds(absoluteCellRange)) {
      return R.err({
        message: 'Some specified cells do not exist in the sheet',
        diagnostic: { node: absoluteCellRange.astNode },
      });
    }

    const cellIndexesToWrite =
      inputSheet.enumerateCellIndexes(relativeCellRange);

    if (textValues.length !== cellIndexesToWrite.length) {
      context.logger.logWarnDiagnostic(
        `The number of values to write (${textValues.length}) does not match the number of cells (${cellIndexesToWrite.length})`,
        { node: relativeCellRange.astNode },
      );
    }

    const resultingSheet = inputSheet.clone();
    for (
      let i = 0;
      i < Math.min(textValues.length, cellIndexesToWrite.length);
      ++i
    ) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cellIndex = cellIndexesToWrite[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const textValue = textValues[i]!.value;

      context.logger.logDebug(
        `Writing "${textValue}" at cell ${cellIndex.toString()}`,
      );

      resultingSheet.writeCell(cellIndex, textValue);
    }

    return R.ok(resultingSheet);
  }
}
