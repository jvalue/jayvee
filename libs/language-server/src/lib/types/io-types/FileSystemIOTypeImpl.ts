import { File } from './FileIOType';
import { FileSystem } from './FileSystemIOType';
import { NONE_TYPE, None } from './NoneIOType';

export class FileSystemImpl implements FileSystem {
  private files: { [filePath: string]: File } = {};

  getFile(filePath: string): File | None {
    return this.files[filePath] || NONE_TYPE;
  }
  putFile(filePath: string, file: File): undefined {
    this.files[filePath] = file;
    return undefined;
  }
}
