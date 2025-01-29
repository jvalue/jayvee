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
export class TextRangeSelectorExecutor extends AbstractBlockExecutor<
  IOType.TEXT_FILE,
  IOType.TEXT_FILE
> {
  public static readonly type = 'TextRangeSelector';

  constructor() {
    super(IOType.TEXT_FILE, IOType.TEXT_FILE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
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

    context.logger.logDebug(
      `Selecting lines from ${lineFrom} to ${
        lineTo === Number.MAX_SAFE_INTEGER ? 'the end' : `${lineTo}`
      }`,
    );

    const result = R.findLineBounds(
      [lineFrom - 1, lineTo],
      lineBreakPattern,
      file.content,
    );

    let start: number | undefined = undefined;
    let end: number | undefined = undefined;
    if (either.isLeft(result)) {
      switch (result.left.firstNonExistentLineIdx) {
        case lineFrom - 1: {
          break;
        }
        case lineTo:
          start = result.left.existingBounds[0]?.start;
          assert(start !== undefined);
          end = file.content.length;
          break;
        default:
          assert(false, 'Unreachable');
      }
    } else {
      const [boundFrom, boundTo] = result.right;
      assert(boundFrom !== undefined);
      assert(boundTo !== undefined);
      start = boundFrom.start;
      end = boundTo.start;
    }

    const newContent =
      start !== undefined && end !== undefined
        ? file.content.substring(start, end)
        : '';

    return R.ok(
      new TextFile(file.name, file.extension, file.mimeType, newContent),
    );
  }
}
