import { IOType } from './IOType';

/**
 * Represents a file with its name, extension, file type, and content.
 * @interface File
 */
export interface File {
  /**
   * The name of the file, without the extension.
   * @property {string} name
   */
  name: string;

  /**
   * The file extension in lower case, empty string for unknown or missing file extensions.
   * @property {FileExtension} extension
   */
  extension: FileExtension;

  /**
   * The MIME type of the file taken from the Content-Type header (for HTTP requests only),
   * Otherwise inferred from the file extension, default application/octet-stream for unknown or missing file extensions.
   * @property {MimeType} mimeType
   */
  mimeType: MimeType;

  /**
   * The content of the file as an ArrayBuffer.
   * @property {ArrayBuffer} content
   */
  content: ArrayBuffer;
}

/**
 * An enumeration of common file extensions. New extensions for Files need to be registered here.
 *
 * @enum {string}
 */
export enum FileExtension {
  '.zip',
  '.txt',
}

/**
 * An enumeration of common MIME types.
 *
 * @enum {string}
 */
export enum MimeType {
  'application/zip',
  'application/octet-stream',
}

/**
 * A mapping of file extension to MIME type. New Mime-types for Files need to be registered here
 *
 * @constant {object}
 */
export const FILE_TYPE = new IOType<File>();
