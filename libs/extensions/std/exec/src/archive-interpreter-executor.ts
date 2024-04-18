// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';
import * as zlib from 'node:zlib';
import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  FileExtension,
  type FileSystem,
  InMemoryFileSystem,
  MimeType,
  err,
  implementsStatic,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as JSZip from 'jszip';

@implementsStatic<BlockExecutorClass>()
export class ArchiveInterpreterExecutor extends AbstractBlockExecutor<
  IOType.FILE,
  IOType.FILE_SYSTEM
> {
  public static readonly type = 'ArchiveInterpreter';

  constructor() {
    super(IOType.FILE, IOType.FILE_SYSTEM);
  }

  async doExecute(
    archiveFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<FileSystem>> {
    const archiveType = context.getPropertyValue(
      'archiveType',
      context.valueTypeProvider.Primitives.Text,
    );
    let fs: R.Result<R.FileSystem>;

    if (archiveType === 'zip') {
      fs = await this.loadZipFileToInMemoryFileSystem(archiveFile, context);
    } else if (archiveType === 'gz') {
      fs = this.loadGzFileToInMemoryFileSystem(archiveFile, context);
    } else {
      return R.err({
        message: `Archive type is not supported`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    }

    if (R.isErr(fs)) {
      return fs;
    }
    return R.ok(fs.right);
  }

  private loadGzFileToInMemoryFileSystem(
    archiveFile: BinaryFile,
    context: ExecutionContext,
  ): R.Result<FileSystem> {
    context.logger.logDebug(`Loading gz file from binary content`);
    try {
      const fs = new InMemoryFileSystem();
      const archivedObject = zlib.gunzipSync(archiveFile.content);

      const extNameArchive = path.extname(archiveFile.name);

      const file = this.createFileFromArchive(
        archiveFile.name,
        archivedObject,
        extNameArchive,
      );

      const addedFile = fs.putFile(
        InMemoryFileSystem.getPathSeparator() + file.name,
        file,
      );
      assert(addedFile != null);

      return R.ok(fs);
    } catch (error: unknown) {
      return R.err(this.generateErrorObject(context, error));
    }
  }

  private async loadZipFileToInMemoryFileSystem(
    archiveFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<FileSystem>> {
    context.logger.logDebug(`Loading zip file from binary content`);
    try {
      const jszip = JSZip();
      const fs = new InMemoryFileSystem();
      const archivedObjects = await jszip.loadAsync(archiveFile.content);
      for (const [relPath, archivedObject] of Object.entries(
        archivedObjects.files,
      )) {
        if (!archivedObject.dir) {
          const content = await archivedObject.async('arraybuffer');

          const file = this.createFileFromArchive(archivedObject.name, content);

          const addedFile = fs.putFile(
            InMemoryFileSystem.getPathSeparator() + relPath,
            file,
          );
          assert(addedFile != null);
        }
      }
      return R.ok(fs);
    } catch (error: unknown) {
      return R.err(this.generateErrorObject(context, error));
    }
  }

  private createFileFromArchive(
    archiveFileName: string,
    content: ArrayBuffer,
    extNameArchive?: string,
  ) {
    const fileName = path.basename(archiveFileName, extNameArchive);
    const extName = path.extname(fileName);

    const mimeType =
      inferMimeTypeFromFileExtensionString(extName) ??
      MimeType.APPLICATION_OCTET_STREAM;
    const fileExtension =
      inferFileExtensionFromFileExtensionString(extName) ?? FileExtension.NONE;

    return new BinaryFile(fileName, fileExtension, mimeType, content);
  }

  private generateErrorObject(context: ExecutionContext, error: unknown) {
    return {
      message: `Unexpected Error ${
        error instanceof Error ? error.message : JSON.stringify(err)
      } occured during processing`,
      diagnostic: { node: context.getCurrentNode(), property: 'name' },
    };
  }
}
