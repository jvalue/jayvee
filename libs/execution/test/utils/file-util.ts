// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  BinaryFile,
  FileExtension,
  MimeType,
  TextFile,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
  splitLines,
} from '../../src';

export function createBinaryFileFromLocalFile(fileName: string): BinaryFile {
  const extName = path.extname(fileName);
  const mimeType =
    inferMimeTypeFromFileExtensionString(extName) ??
    MimeType.APPLICATION_OCTET_STREAM;
  const fileExtension =
    inferFileExtensionFromFileExtensionString(extName) ?? FileExtension.NONE;
  const file = readFileSync(path.resolve(__dirname, fileName));
  return new BinaryFile(path.basename(fileName), fileExtension, mimeType, file);
}

export function createTextFileFromLocalFile(fileName: string): TextFile {
  const extName = path.extname(fileName);
  const mimeType =
    inferMimeTypeFromFileExtensionString(extName) ??
    MimeType.APPLICATION_OCTET_STREAM;
  const fileExtension =
    inferFileExtensionFromFileExtensionString(extName) ?? FileExtension.NONE;
  const fileContent = readFileSync(path.resolve(__dirname, fileName), 'utf-8');

  return new TextFile(
    path.basename(fileName),
    fileExtension,
    mimeType,
    splitLines(fileContent, /\r?\n/),
  );
}
