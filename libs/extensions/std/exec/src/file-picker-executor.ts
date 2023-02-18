import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { File, FileSystem } from '@jayvee/language-server';

export class FilePickerExecutor extends BlockExecutor<FileSystem, File | null> {
  constructor() {
    super('FilePicker');
  }

  override execute(fileSystem: FileSystem): Promise<R.Result<File | null>> {
    const file = fileSystem.getFile(this.getStringAttributeValue('path'));
    return Promise.resolve(R.ok(file));
  }
}
