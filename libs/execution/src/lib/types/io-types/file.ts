import { IOType } from '@jayvee/language-server';

import { IOTypeImplementation } from './io-type-implementation';

/**
 * Represents a file with its name, extension, file type, and content.
 * @class File
 */
export class File implements IOTypeImplementation<IOType.FILE> {
  public readonly ioType = IOType.FILE;

  constructor(
    /**
     * The name of the file, without the extension.
     * @property {string} name
     */
    public readonly name: string,

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

    /**
     * The content of the file as an ArrayBuffer.
     * @property {ArrayBuffer} content
     */
    public readonly content: ArrayBuffer,
  ) {}
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
