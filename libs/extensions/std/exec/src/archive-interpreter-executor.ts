import * as path from 'path';

import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import {
  File,
  FileExtension,
  FileSystem,
  InMemoryFileSystem,
  MimeType,
} from '@jayvee/language-server';
import JSZip = require('jszip');
import * as mime from 'mime-types';

export class ArchiveInterpreterExecutor extends BlockExecutor<
  File,
  FileSystem
> {
  constructor() {
    // Needs to match the name in meta information:
    super('ArchiveInterpreter');
  }

  override async execute(archiveFile: File): Promise<R.Result<FileSystem>> {
    // Accessing attribute values by their name:
    if (this.getStringAttributeValue('archiveType') === 'zip') {
      const fs = await this.loadZipFileToInMemoryFileSystem(archiveFile);
      if (R.isErr(fs)) {
        return fs;
      }
      return R.ok(fs.right);
    }
    return R.err({
      message: `Archive is not a zip-archive`,
      // TODO: What should i return here?
      diagnostic: { node: this.block },
    });
  }

  private loadZipFileToInMemoryFileSystem(
    archiveFile: File,
  ): Promise<R.Result<FileSystem>> {
    this.logger.logDebug(`Loading zip file from binary content`);
    return new Promise((resolve) => {
      const jszip = JSZip();
      const root = new InMemoryFileSystem();
      jszip
        .loadAsync(archiveFile.content)
        .then((archivedObjects) => {
          archivedObjects.forEach((relPath, archivedObject) => {
            // Jszip lists directories AND files as objects, we just need the files, when they are put into our filesystem, the corresponding directory gets created by the inmemoryfilesystem
            if (!archivedObject.dir) {
              archivedObject
                .async('arraybuffer')
                .then((content) => {
                  const extName = path.extname(archivedObject.name);
                  const fileName = path.basename(archivedObject.name, extName);

                  // Infer Mimetype from file-extension, if not inferrable, then default to application/octet-stream

                  let inferredMimeType = mime.lookup(extName) as MimeType;
                  if (!Object.values(MimeType).includes(inferredMimeType)) {
                    inferredMimeType = MimeType.APPLICATION_OCTET_STREAM;
                  }

                  // Infer FileExtension from extension in filename, if not inferrable, then default to None
                  let inferredFileExtension = extName.replace(
                    '.',
                    '',
                  ) as FileExtension;
                  if (!Object.values(MimeType).includes(inferredMimeType)) {
                    inferredFileExtension = FileExtension.NONE;
                  }

                  const file: File = {
                    name: fileName,
                    extension: inferredFileExtension,
                    content: content,
                    mimeType: inferredMimeType,
                  };

                  // Put files creates dir in root, if dir does not exist
                  root.putFile(relPath, file);
                })
                .catch((error: Error) => {
                  resolve(
                    R.err({
                      message: `Unexpected Error ${error.message} occured during processing of objects inside the archive`,
                      // TODO: What should i return here?
                      diagnostic: { node: this.block },
                    }),
                  );
                });
            }
          });
        })
        .catch((error: Error) => {
          resolve(
            R.err({
              message: `Unexpected Error ${error.message} occured during load of archivefile`,
              // TODO: What should i return here?
              diagnostic: { node: this.block },
            }),
          );
        });

      resolve(R.ok(root));
    });
  }
}
