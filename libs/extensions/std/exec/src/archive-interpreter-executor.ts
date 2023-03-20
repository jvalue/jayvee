import * as path from 'path';

import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  File,
  FileExtension,
  FileSystem,
  InMemoryFileSystem,
  MimeType,
  err,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
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
    archiveFile: File,
    context: ExecutionContext,
  ): Promise<R.Result<FileSystem>> {
    if (context.getTextAttributeValue('archiveType') === 'zip') {
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
    archiveFile: File,
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
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    }
  }
}
