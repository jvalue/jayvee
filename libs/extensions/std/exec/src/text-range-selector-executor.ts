// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  TextFile,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class TextRangeSelectorExecutor extends AbstractBlockExecutor<
  IOType.TEXT_FILE,
  IOType.TEXT_FILE
> {
  public static readonly type = 'TextRangeSelector';

  constructor() {
    super(IOType.TEXT_FILE, IOType.TEXT_FILE);
  }

  async doExecute(
    file: TextFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const lineFrom = context.getPropertyValue(
      'lineFrom',
      context.valueTypeProvider.Primitives.Integer,
    );
    const lineTo = context.getPropertyValue(
      'lineTo',
      context.valueTypeProvider.Primitives.Integer,
    );
    const lineBreakPattern = context.getPropertyValue(
      'lineBreak',
      context.valueTypeProvider.Primitives.Regex,
    );

    // eslint-disable-next-line @typescript-eslint/require-await
    return R.transformTextFileLines(file, lineBreakPattern, async (lines) => {
      context.logger.logDebug(
        `Selecting lines from ${lineFrom} to ${
          lineTo === Number.MAX_SAFE_INTEGER || lineTo >= lines.length
            ? 'the end'
            : `${lineTo}`
        }`,
      );
      return R.ok(lines.slice(lineFrom - 1, lineTo));
    });
  }
}
