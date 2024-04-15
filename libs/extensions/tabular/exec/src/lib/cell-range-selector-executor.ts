// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
} from '@jvalue/jayvee-execution';
import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class CellRangeSelectorExecutor extends AbstractBlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  public static readonly type = 'CellRangeSelector';

  constructor() {
    super(IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeRange = context.getPropertyValue(
      'select',
      PrimitiveValuetypes.CellRange,
    );

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
