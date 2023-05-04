// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  TextFile,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  IOType,
  NUMBER_TYPEGUARD,
  evaluatePropertyValueExpression,
} from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class TextLineDeleterExecutor
  implements BlockExecutor<IOType.TEXT_FILE, IOType.TEXT_FILE>
{
  public static readonly type = 'TextLineDeleter';
  public readonly inputType = IOType.TEXT_FILE;
  public readonly outputType = IOType.TEXT_FILE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    file: TextFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const lineExpressions =
      context.getExpressionCollectionPropertyValue('lines');
    const lineEntries = lineExpressions.map((expression) => {
      const value = evaluatePropertyValueExpression(
        expression,
        context.evaluationContext,
        NUMBER_TYPEGUARD,
      );
      return { lineNumber: value, astNode: expression };
    });
    const numberOfLines = file.content.length;

    for (const lineEntry of lineEntries) {
      const lineNumber = lineEntry.lineNumber;
      if (lineNumber > numberOfLines) {
        return R.err({
          message: `Line ${lineNumber} does not exist in the text file, only ${file.content.length} line(s) are present`,
          diagnostic: { node: lineEntry.astNode },
        });
      }
    }

    const distinctLines = new Set(lineEntries.map((e) => e.lineNumber));
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
