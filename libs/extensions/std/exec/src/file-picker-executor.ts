import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  ExecutionContext,
  File,
  FileSystem,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

export class FilePickerExecutor
  implements BlockExecutor<IOType.FILE_SYSTEM, IOType.FILE>
{
  public readonly blockType = 'FilePicker';
  public readonly inputType = IOType.FILE_SYSTEM;
  public readonly outputType = IOType.FILE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    fileSystem: FileSystem,
    context: ExecutionContext,
  ): Promise<R.Result<File | null>> {
    const file = fileSystem.getFile(context.getTextAttributeValue('path'));
    return R.ok(file);
  }
}
