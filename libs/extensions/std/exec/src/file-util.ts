import { FileExtension, MimeType } from '@jayvee/language-server';
import * as mime from 'mime-types';

export function inferMimeTypeFromString(
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

export function inferFileExtensionFromString(
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
