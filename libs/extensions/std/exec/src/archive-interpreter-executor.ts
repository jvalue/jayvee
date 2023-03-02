import * as path from 'path';

import * as R from '@jayvee/execution';
import {
  BlockExecutor,
  File,
  FileExtension,
  FileSystem,
  InMemoryFileSystem,
  MimeType,
  err,
} from '@jayvee/execution';
import { IOType } from '@jayvee/language-server';
import * as JSZip from 'jszip';

import {
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromContentTypeString,
} from './file-util';

export class ArchiveInterpreterExecutor extends BlockExecutor<
  IOType.FILE,
  IOType.FILE_SYSTEM
> {
  constructor() {
    // Needs to match the name in meta information:
    super('ArchiveInterpreter', IOType.FILE, IOType.FILE_SYSTEM);
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
      diagnostic: { node: this.block, property: 'name' },
    });
  }

  private async loadZipFileToInMemoryFileSystem(
    archiveFile: File,
  ): Promise<R.Result<FileSystem>> {
    this.logger.logDebug(`Loading zip file from binary content`);
    try {
      const jszip = JSZip();
      const root = new InMemoryFileSystem();
      const archivedObjects = await jszip.loadAsync(archiveFile.content);
      for (const [relPath, archivedObject] of Object.entries(
        archivedObjects.files,
      )) {
        if (!archivedObject.dir) {
          const content = await archivedObject.async('arraybuffer');
          // Ext incl. leading dot
          const extName = path.extname(archivedObject.name);
          // Filename without ext and dot
          const fileName = path.basename(archivedObject.name, extName);
          const mimeType =
            inferMimeTypeFromContentTypeString(extName) ||
            MimeType.APPLICATION_OCTET_STREAM;
          const fileExtension =
            inferFileExtensionFromFileExtensionString(extName) ||
            FileExtension.NONE;
          const file = new File(fileName, fileExtension, mimeType, content);
          root.putFile(relPath, file);
        }
      }
      return R.ok(root);
    } catch (error: unknown) {
      return R.err({
        message: `Unexpected Error ${
          error instanceof Error ? error.message : JSON.stringify(err)
        } occured during processing`,
        diagnostic: { node: this.block, property: 'name' },
      });
    }
  }
}
