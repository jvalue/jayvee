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

// eslint-disable-next-line @typescript-eslint/require-await
async function deleteLines(
  lines: string[],
  deleteIdxs: number[],
  context: ExecutionContext,
): Promise<R.Result<string[]>> {
  let lineIdx = 0;
  for (const deleteIdx of deleteIdxs) {
    if (deleteIdx > lines.length) {
      return R.err({
        message: `Line ${deleteIdx} does not exist in the text file, only ${lines.length} line(s) are present`,
        diagnostic: {
          node: context.getOrFailProperty('lines').value,
          property: 'values',
          index: lineIdx,
        },
      });
    }
    ++lineIdx;
  }

  const distinctLines = new Set(deleteIdxs);
  const sortedLines = [...distinctLines].sort((a, b) => a - b);

  context.logger.logDebug(`Deleting line(s) ${sortedLines.join(', ')}`);

  const reversedLines = sortedLines.reverse();
  for (const lineToDelete of reversedLines) {
    lines.splice(lineToDelete - 1, 1);
  }

  return R.ok(lines);
}

@implementsStatic<BlockExecutorClass>()
export class TextLineDeleterExecutor extends AbstractBlockExecutor<
  IOType.TEXT_FILE,
  IOType.TEXT_FILE
> {
  public static readonly type = 'TextLineDeleter';

  constructor() {
    super(IOType.TEXT_FILE, IOType.TEXT_FILE);
  }

  async doExecute(
    file: TextFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const deleteIdxs = context.getPropertyValue(
      'lines',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.Integer,
      ),
    );
    const lineBreakPattern = context.getPropertyValue(
      'lineBreak',
      context.valueTypeProvider.Primitives.Regex,
    );

    return R.transformTextFileLines(file, lineBreakPattern, (lines) =>
      deleteLines(lines, deleteIdxs, context),
    );
  }
}
