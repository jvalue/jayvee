// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class CellWriterExecutor extends AbstractBlockExecutor<
  IOType.SHEET,
  IOType.SHEET
> {
  public static readonly type = 'CellWriter';

  constructor() {
    super(IOType.SHEET, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const relativeCellRange = context.getPropertyValue(
      'at',
      PrimitiveValuetypes.CellRange,
    );
    const writeValues = context.getPropertyValue(
      'write',
      new CollectionValuetype(PrimitiveValuetypes.Text),
    );

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

    if (writeValues.length !== cellIndexesToWrite.length) {
      context.logger.logWarnDiagnostic(
        `The number of values to write (${writeValues.length}) does not match the number of cells (${cellIndexesToWrite.length})`,
        { node: relativeCellRange.astNode },
      );
    }

    const resultingSheet = inputSheet.clone();
    for (
      let i = 0;
      i < Math.min(writeValues.length, cellIndexesToWrite.length);
      ++i
    ) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cellIndex = cellIndexesToWrite[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const writeValue = writeValues[i]!;

      context.logger.logDebug(
        `Writing "${writeValue}" at cell ${cellIndex.toString()}`,
      );

      resultingSheet.writeCell(cellIndex, writeValue);
    }

    return R.ok(resultingSheet);
  }
}
