import * as R from '@jayvee/execution';
import { BlockExecutor, File, FileSystem } from '@jayvee/execution';
import { IOType } from '@jayvee/language-server';

export class FilePickerExecutor extends BlockExecutor<
  IOType.FILE_SYSTEM,
  IOType.FILE
> {
  constructor() {
    super('FilePicker', IOType.FILE_SYSTEM, IOType.FILE);
  }

  override execute(fileSystem: FileSystem): Promise<R.Result<File | null>> {
    const file = fileSystem.getFile(this.getStringAttributeValue('path'));
    return Promise.resolve(R.ok(file));
  }
}
