// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

import {
  BinaryFile,
  FileExtension,
  MimeType,
  TextFile,
} from '@jvalue/jayvee-execution';

import {
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromContentTypeString,
} from '../src/file-util';
import { splitLines } from '../src/string-util';

export function createBinaryFileFromLocalFile(fileName: string): BinaryFile {
  const extName = path.extname(fileName);
  const mimeType =
    inferMimeTypeFromContentTypeString(extName) ||
    MimeType.APPLICATION_OCTET_STREAM;
  const fileExtension =
    inferFileExtensionFromFileExtensionString(extName) || FileExtension.NONE;
  const file = readFileSync(
    path.resolve(__dirname, '../test/assets/file-picker-executor/', fileName),
  );
  return new BinaryFile(path.basename(fileName), fileExtension, mimeType, file);
}

export function createTextFileFromLocalFile(fileName: string): TextFile {
  const extName = path.extname(fileName);
  const mimeType =
    inferMimeTypeFromContentTypeString(extName) ||
    MimeType.APPLICATION_OCTET_STREAM;
  const fileExtension =
    inferFileExtensionFromFileExtensionString(extName) || FileExtension.NONE;
  const fileContent = readFileSync(
    path.resolve(__dirname, '../test/assets/file-picker-executor/', fileName),
    'utf-8',
  );

  return new TextFile(
    path.basename(fileName),
    fileExtension,
    mimeType,
    splitLines(fileContent, /\r?\n/),
  );
}
