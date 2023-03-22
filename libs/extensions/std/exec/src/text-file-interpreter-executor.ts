import { TextDecoder } from 'util';

import * as R from '@jvalue/execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
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
  async execute(file: BinaryFile): Promise<R.Result<TextFile>> {
    const encoding = 'utf-8';
    const decoder = new TextDecoder(encoding);
    const textContent = decoder.decode(file.content);

    const lines = splitLines(textContent);

    return R.ok(new TextFile(file.name, file.extension, file.mimeType, lines));
  }
}

function splitLines(textContent: string): string[] {
  const lines = textContent.split(/\r?\n/);

  // There may be an additional empty line due to the previous splitting
  if (lines[lines.length - 1] === '') {
    lines.splice(lines.length - 1, 1);
  }

  return lines;
}
