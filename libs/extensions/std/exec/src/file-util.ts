import { FileExtension, MimeType } from '@jayvee/language-server';
import * as mime from 'mime-types';

export function inferMimeTypeFromFileExtension(
  FileExtension: string,
): MimeType | undefined {
  const inferredMimeType = mime.lookup(FileExtension) as MimeType;
  if (!Object.values(MimeType).includes(inferredMimeType)) {
    return undefined;
  }
  return inferredMimeType;
}

export function inferFileExtensionFromMimeType(
  FileExtension: string,
): FileExtension | undefined {
  const inferredFileExtension = FileExtension.replace('.', '') as FileExtension;
  if (!Object.values(FileExtension).includes(inferredFileExtension)) {
    return undefined;
  }
  return inferredFileExtension;
}
