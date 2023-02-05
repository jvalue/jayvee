import { string } from 'fp-ts';
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
  /** The file extension in lower case, empty string for unknown or missing file extensions*/
  extension: FileExtension;
  /** The MIME type of the file taken from the Content-Type header (for HTTP requests only), Otherwise inferred from the file extension, default application/octet-stream for unknown or missing file extensions*/
  mimeType: MimeType;
  /** The content of the file as an ArrayBuffer. */
  content: ArrayBuffer;
}

export enum FileExtension {
  '.zip',
  '.txt',
}

export enum MimeType {
  'application/zip',
  'application/octet-stream',
}

export const FILE_TYPE = new IOType<File>();

export interface FileSystem {
  makeDirectory(filePath: string): string | undefined;
  readFile(filePath: string): File | None;
  writeFile(filePath: string, file: File): undefined;
}
export const FILE_SYSTEM_TYPE = new IOType<FileSystem>();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface None {}
export const NONE_TYPE = new IOType<None>();
