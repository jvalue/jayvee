import { AbstractDataType } from '../data-types/AbstractDataType';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class IOType<T = unknown> {}

export const UNDEFINED_TYPE = new IOType<undefined>();

export interface Sheet {
  data: string[][];
  width: number;
  height: number;
}

export const SHEET_TYPE = new IOType<Sheet>();

export interface Table {
  columnNames: string[];
  columnTypes: Array<AbstractDataType | undefined>;
  data: string[][];
}
export const TABLE_TYPE = new IOType<Table>();

/**
 * Represents a file with its name, extension, file type, and content.
 */
export interface File {
  /** The name of the file, without the extension. */
  name: string;
  /** The file extension, including the leading dot. */
  extension: FileExtension;
  /** The MIME type of the file taken from the Content-Type header (for HTTP requests only) Otherwise inferred from the file extension, default application/octet-stream for unknown or missing file extensions*/
  type: FileType;
  /** The content of the file as an ArrayBuffer. */
  content: ArrayBuffer;
}
enum FileExtension {
  Zip = '.zip',
}
enum FileType {
  ApplicationOctetStream = 'application/octet-stream',
  HtmlText = 'text/html',
}
export const FILE_TYPE = new IOType<File>();
