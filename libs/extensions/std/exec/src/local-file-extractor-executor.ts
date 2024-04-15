// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'fs/promises';
import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  BlockExecutorClass,
  ExecutionContext,
  FileExtension,
  MimeType,
  None,
  implementsStatic,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class LocalFileExtractorExecutor extends AbstractBlockExecutor<
  IOType.NONE,
  IOType.FILE
> {
  public static readonly type = 'LocalFileExtractor';

  constructor() {
    super(IOType.NONE, IOType.FILE);
  }

  async doExecute(
    input: None,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile>> {
    const filePath = context.getPropertyValue(
      'filePath',
      PrimitiveValuetypes.Text,
    );

    if (filePath.includes('..')) {
      return R.err({
        message: 'File path cannot include "..". Path traversal is restricted.',
        diagnostic: { node: context.getCurrentNode(), property: 'filePath' },
      });
    }

    try {
      const rawData = await fs.readFile(filePath);

      // Infer FileName and FileExtension from filePath
      const fileName = path.basename(filePath);
      const extName = path.extname(fileName);
      const fileExtension =
        inferFileExtensionFromFileExtensionString(extName) ??
        FileExtension.NONE;

      // Infer Mimetype from FileExtension, if not inferrable, then default to application/octet-stream
      const mimeType: MimeType | undefined =
        inferMimeTypeFromFileExtensionString(fileExtension) ??
        MimeType.APPLICATION_OCTET_STREAM;

      // Create file and return file
      const file = new BinaryFile(
        fileName,
        fileExtension,
        mimeType,
        rawData.buffer as ArrayBuffer,
      );

      context.logger.logDebug(`Successfully extraced file ${filePath}`);
      return R.ok(file);
    } catch (error) {
      return R.err({
        message: `File '${filePath}' not found.`,
        diagnostic: { node: context.getCurrentNode(), property: 'filePath' },
      });
    }
  }
}
