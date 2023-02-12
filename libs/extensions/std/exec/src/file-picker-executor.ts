import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import {
  File,
  FileExtension,
  FileSystem,
  MimeType,
} from '@jayvee/language-server';

export class FilePickerExecutor extends BlockExecutor<FileSystem, File> {
  constructor() {
    super('FilePicker');
  }

  override async execute(): Promise<R.Result<File>> {
    // Accessing attribute values by their name:
    const url = this.getStringAttributeValue('url');

    if (R.isErr(file)) {
      return file;
    }

    return R.ok(file.right);
  }
}
