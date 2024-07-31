// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'node:fs/promises';
import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  FileExtension,
  MimeType,
  type None,
  implementsStatic,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

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
      context.valueTypeProvider.Primitives.Text,
    );

    if (filePath.includes('..')) {
      return R.err({
        message: 'File path cannot include "..". Path traversal is restricted.',
        diagnostic: { node: context.getCurrentNode(), property: 'filePath' },
      });
    }

    let rawData: Buffer | undefined = undefined;
    try {
      rawData = await fs.readFile(filePath);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : `Could not read file ${filePath}`;
      return R.err({
        message: message,
        diagnostic: { node: context.getCurrentNode(), property: 'filePath' },
      });
    }

    // Infer FileName and FileExtension from filePath
    const fileName = path.basename(filePath);
    const extName = path.extname(fileName);
    const fileExtension =
      inferFileExtensionFromFileExtensionString(extName) ?? FileExtension.NONE;

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
  }
}
