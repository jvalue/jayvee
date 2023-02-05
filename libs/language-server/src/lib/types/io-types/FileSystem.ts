import { File, FileSystem } from './io-types';

export class FileSystemImpl implements FileSystem {
  readFile(path: string): File {
    throw new Error('Method not implemented.');
  }
}
