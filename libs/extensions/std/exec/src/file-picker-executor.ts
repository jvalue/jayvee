import * as R from '@jvalue/execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  FileSystem,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

@implementsStatic<BlockExecutorClass>()
export class FilePickerExecutor
  implements BlockExecutor<IOType.FILE_SYSTEM, IOType.FILE>
{
  public static readonly type = 'FilePicker';
  public readonly inputType = IOType.FILE_SYSTEM;
  public readonly outputType = IOType.FILE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    fileSystem: FileSystem,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile | null>> {
    const file = fileSystem.getFile(context.getTextPropertyValue('path'));
    return R.ok(file);
  }
}
