// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as mime from 'mime-types';

import * as R from '../blocks';
import { FileExtension, MimeType, TextFile } from '../types';

export function inferMimeTypeFromFileExtensionString(
  fileExtension: string | undefined,
): MimeType | undefined {
  if (fileExtension !== undefined) {
    const inferredMimeType = mime.lookup(fileExtension) as MimeType;
    if (Object.values(MimeType).includes(inferredMimeType)) {
      return inferredMimeType;
    }
  }
  return undefined;
}

export function inferFileExtensionFromFileExtensionString(
  fileExtension: string | undefined,
): FileExtension | undefined {
  if (fileExtension !== undefined) {
    const inferredFileExtension = fileExtension.replace(
      '.',
      '',
    ) as FileExtension;
    if (Object.values(FileExtension).includes(inferredFileExtension)) {
      return inferredFileExtension;
    }
  }
  return undefined;
}

export function inferFileExtensionFromContentTypeString(
  contentType: string | undefined,
): FileExtension | undefined {
  if (contentType !== undefined) {
    const inferredFileExtension = mime.extension(contentType);
    if (inferredFileExtension !== false) {
      if (
        Object.values(FileExtension).includes(
          inferredFileExtension as FileExtension,
        )
      ) {
        return inferredFileExtension as FileExtension;
      }
    }
  }
  return undefined;
}

export async function transformTextFileLines(
  file: TextFile,
  lineBreakPattern: RegExp,
  transformFn: (lines: string[]) => Promise<R.Result<string[]>>,
): Promise<R.Result<TextFile>> {
  const lines = file.content.split(lineBreakPattern);
  const lineBreak = file.content.match(lineBreakPattern)?.at(0) ?? '';

  // There may be an additional empty line due to the previous splitting
  let emptyNewline = false;
  if (lines[lines.length - 1] === '') {
    emptyNewline = true;
    lines.pop();
  }

  const newLines = await transformFn(lines);
  if (R.isErr(newLines)) {
    return newLines;
  }

  let newContent = newLines.right.join(lineBreak);
  if (emptyNewline) {
    newContent += lineBreak;
  }

  return R.ok(
    new TextFile(file.name, file.extension, file.mimeType, newContent),
  );
}
