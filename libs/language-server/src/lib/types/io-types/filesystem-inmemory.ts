import { File } from './file-io-type';
import { FileSystem } from './filesystem-io-type';
import { NONE_TYPE, None } from './none-io-type';

export class InMemoryFileSystem implements FileSystem {
  private files: { [filePath: string]: File } = {};

  getFile(filePath: string): File | None {
    return this.files[filePath] || NONE_TYPE;
  }
  putFile(filePath: string, file: File): FileSystem {
    this.files[filePath] = file;
    return this;
  }
}
