// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FileSystemNode } from './filesystem-node';

export abstract class FileSystemFile<T> extends FileSystemNode {
  constructor(
    /**
     * The name of the file with extension
     * @property {string} name
     */
    public override readonly name: string,

    /**
     * The file extension in lower case, NONE / empty string for unknown or missing file extensions.
     * @property {FileExtension} extension
     */
    public readonly extension: FileExtension,

    /**
     * The MIME type of the file taken from the Content-Type header (for HTTP requests only),
     * Otherwise inferred from the file extension, default application/octet-stream for unknown or missing file extensions.
     * @property {MimeType} mimeType
     */
    public readonly mimeType: MimeType,

    public readonly content: T,
  ) {
    super(name);
  }

  override getNode(pathParts: string[]): FileSystemNode | null {
    const [firstPart, ...rest] = pathParts;
    if (firstPart === this.name && rest.length === 0) {
      return this;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override putNode(path: string[]): FileSystemNode | null {
    return null;
  }

  override toDirectoryString(indentation: number): string {
    return ' '.repeat(indentation) + this.name + ` (${this.mimeType})`;
  }
}
/**
 * An enumeration of common file extensions. New extensions for Files need to be registered here.
 *
 * @enum {string}
 */
export enum FileExtension {
  ZIP = 'zip',
  TXT = 'txt',
  CSV = 'csv',
  NONE = '',
}

/**
 * An enumeration of common MIME types.
 *
 * @enum {string}
 */
export enum MimeType {
  APPLICATION_ZIP = 'application/zip',
  APPLICATION_OCTET_STREAM = 'application/octet-stream',
  TEXT_CSV = 'text/csv',
  TEXT_PLAIN = 'text/plain',
}
