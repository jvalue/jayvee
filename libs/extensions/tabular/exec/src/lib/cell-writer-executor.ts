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
import { IOType, getCellIndex, isCellWrapper } from '@jvalue/jayvee-language-server';

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
    const relativeCell = context.getCellRangePropertyValue('at');
    const content = context.getTextPropertyValue('write');

    assert(isCellWrapper(relativeCell));

    const absoluteCell = inputSheet.resolveRelativeIndexes(relativeCell);
    if (!inputSheet.isInBounds(absoluteCell)) {
      return R.err({
        message: 'The specified cell does not exist in the sheet',
        diagnostic: { node: absoluteCell.astNode },
      });
    }

    context.logger.logDebug(
      `Writing "${content}" at cell ${getCellIndex(absoluteCell).toString()}`,
    );

    const resultingSheet = inputSheet.clone();
    resultingSheet.writeCell(absoluteCell, content);

    return R.ok(resultingSheet);
  }
}
