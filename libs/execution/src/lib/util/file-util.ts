// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as mime from 'mime-types';

import { FileExtension, MimeType } from '../types';

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
