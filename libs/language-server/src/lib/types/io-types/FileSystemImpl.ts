import * as fs from 'fs';
import * as pth from 'path';

import * as mime from 'mime-types';

import {
  File,
  FileSystem,
  NONE_TYPE,
  None,
  MimeType,
  FileExtension,
} from './io-types';

export class FileSystemImpl implements FileSystem {
  writeFile(filePath: string, file: File) {
    throw new Error('Method not implemented.');
    return undefined;
  }
  makeDirectory(filePath: string): string | undefined {
    throw new Error('Method not implemented.');
  }
  readFile(filePath: string): File | None {
    try {
      const fileBuffer = fs.readFileSync(filePath); //if read fails, error is thrown, otherwise buffer returned
      const fileName = pth.basename(filePath, pth.extname(filePath)); //returns filename without extension
      const fileExtension = pth.extname(filePath).toLowerCase();

      //Break, if file extension is not supported yet
      if (!(fileExtension in FileExtension)) {
        return NONE_TYPE;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const fileType = mime.lookup(fileExtension) || 'application/octet-stream'; //lookup() returns string or false, if false, default 'application/octet-stream'

      //Break, if mime_type is not supported yet
      if (!(fileType in MimeType)) {
        return NONE_TYPE;
      }
      return {
        name: fileName,
        extension: fileExtension,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mimeType: fileType,
        content: fileBuffer,
      };
    } catch (err) {
      console.error(err);
    }
    return NONE_TYPE;
  }
}
