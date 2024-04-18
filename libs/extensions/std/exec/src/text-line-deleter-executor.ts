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
    const lines = context.getPropertyValue(
      'lines',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.Integer,
      ),
    );
    const numberOfLines = file.content.length;

    let lineIndex = 0;
    for (const lineNumber of lines) {
      if (lineNumber > numberOfLines) {
        return R.err({
          message: `Line ${lineNumber} does not exist in the text file, only ${file.content.length} line(s) are present`,
          diagnostic: {
            node: context.getOrFailProperty('lines').value,
            property: 'values',
            index: lineIndex,
          },
        });
      }

      ++lineIndex;
    }

    const distinctLines = new Set(lines);
    const sortedLines = [...distinctLines].sort((a, b) => a - b);

    context.logger.logDebug(`Deleting line(s) ${sortedLines.join(', ')}`);

    const reversedLines = sortedLines.reverse();
    const newContent = [...file.content];
    for (const lineToDelete of reversedLines) {
      newContent.splice(lineToDelete - 1, 1);
    }

    return R.ok(
      new TextFile(file.name, file.extension, file.mimeType, newContent),
    );
  }
}
