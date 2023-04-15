// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  FileExtension,
  FileSystem,
  InMemoryFileSystem,
  MimeType,
  err,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as JSZip from 'jszip';

import {
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromContentTypeString,
} from './file-util';

@implementsStatic<BlockExecutorClass>()
export class ArchiveInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.FILE_SYSTEM>
{
  public static readonly type = 'ArchiveInterpreter';
  public readonly inputType = IOType.FILE;
  public readonly outputType = IOType.FILE_SYSTEM;

  async execute(
    archiveFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<FileSystem>> {
    if (context.getTextPropertyValue('archiveType') === 'zip') {
      const fs = await this.loadZipFileToInMemoryFileSystem(
        archiveFile,
        context,
      );
      if (R.isErr(fs)) {
        return fs;
      }
      return R.ok(fs.right);
    }
    return R.err({
      message: `Archive is not a zip-archive`,
      diagnostic: { node: context.getCurrentNode(), property: 'name' },
    });
  }

  private async loadZipFileToInMemoryFileSystem(
    archiveFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<FileSystem>> {
    context.logger.logDebug(`Loading zip file from binary content`);
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
          const fileName = path.basename(archivedObject.name);
          const mimeType =
            inferMimeTypeFromContentTypeString(extName) ||
            MimeType.APPLICATION_OCTET_STREAM;
          const fileExtension =
            inferFileExtensionFromFileExtensionString(extName) ||
            FileExtension.NONE;
          const file = new BinaryFile(
            fileName,
            fileExtension,
            mimeType,
            content,
          );
          if (root.putFile(relPath, file) == null) {
            return R.err({
              message: `File with name ${file.name} and path ${relPath} failed to insert`,
              diagnostic: { node: context.getCurrentNode(), property: 'name' },
            });
          }
        }
      }
      return R.ok(root);
    } catch (error: unknown) {
      return R.err({
        message: `Unexpected Error ${
          error instanceof Error ? error.message : JSON.stringify(err)
        } occured during processing`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    }
  }
}
