// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  TextFile,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import { either } from 'fp-ts';

@implementsStatic<BlockExecutorClass>()
export class TextLineDeleterExecutor extends AbstractBlockExecutor<
  IOType.TEXT_FILE,
  IOType.TEXT_FILE
> {
  public static readonly type = 'TextLineDeleter';

  constructor() {
    super(IOType.TEXT_FILE, IOType.TEXT_FILE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    file: TextFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const lineIdxs = context.getPropertyValue(
      'lines',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.Integer,
      ),
    );
    if (lineIdxs[0] !== undefined && file.content === '') {
      return R.err({
        message: `Line ${lineIdxs[0]} does not exist in the text file.`,
        diagnostic: {
          node: context.getOrFailProperty('lines').value,
          property: 'values',
          index: 0,
        },
      });
    }

    const lineBreakPattern = context.getPropertyValue(
      'lineBreak',
      context.valueTypeProvider.Primitives.Regex,
    );

    const distinctLines = new Set(lineIdxs);
    const sortedLines = [...distinctLines].sort((a, b) => a - b);

    context.logger.logDebug(`Deleting line(s) ${sortedLines.join(', ')}`);

    const result = R.findLineBounds(
      sortedLines.map((lineIdx) => {
        assert(lineIdx > 0);
        return lineIdx - 1;
      }),
      lineBreakPattern,
      file.content,
    );

    if (either.isLeft(result)) {
      return R.err({
        message: `Line ${result.left.firstNonExistentLineIdx} does not exist in the text file.`,
        diagnostic: {
          node: context.getOrFailProperty('lines').value,
          property: 'values',
          index: lineIdxs.indexOf(result.left.firstNonExistentLineIdx),
        },
      });
    }

    let remainingOldContent = file.content;
    let newContent = '';
    for (const { start, length } of result.right) {
      newContent += remainingOldContent.substring(0, start);
      remainingOldContent = remainingOldContent.substring(length);
    }
    newContent += remainingOldContent;

    return R.ok(
      new TextFile(file.name, file.extension, file.mimeType, newContent),
    );
  }
}
