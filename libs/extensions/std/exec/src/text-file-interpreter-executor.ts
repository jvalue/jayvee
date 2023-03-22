import { TextDecoder } from 'util';

import * as R from '@jvalue/execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  TextFile,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

@implementsStatic<BlockExecutorClass>()
export class TextFileInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.TEXT_FILE>
{
  public static readonly type = 'TextFileInterpreter';
  public readonly inputType = IOType.FILE;
  public readonly outputType = IOType.TEXT_FILE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    file: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const encoding = context.getTextPropertyValue('encoding');
    const lineBreak = context.getRegexPropertyValue('lineBreak');

    const decoder = new TextDecoder(encoding);
    context.logger.logDebug(
      `Decoding file content using encoding "${encoding}"`,
    );
    const textContent = decoder.decode(file.content);

    context.logger.logDebug(
      `Splitting lines using line break /${lineBreak.source}/`,
    );
    const lines = splitLines(textContent, lineBreak);
    context.logger.logDebug(
      `Lines were split successfully, the resulting text file has ${lines.length} lines`,
    );

    return R.ok(new TextFile(file.name, file.extension, file.mimeType, lines));
  }
}

function splitLines(textContent: string, lineBreak: RegExp): string[] {
  const lines = textContent.split(lineBreak);

  // There may be an additional empty line due to the previous splitting
  if (lines[lines.length - 1] === '') {
    lines.splice(lines.length - 1, 1);
  }

  return lines;
}
