import { File } from './file-io-type';
import { IOType } from './io-type';
import { None } from './none-io-type';

/**
 * FileSystem interface defines the operations that a file system implementation should have.
 * @interface FileSystem
 */
export interface FileSystem {
  /**
   * Retrieves a file from the file system.
   * @function getFile
   * @param {string} filePath - The file path.
   * @returns {File | FileSystem | None} - The file or None if the file does not exist.
   */
  getFile(filePath: string): File | None;

  /**
   * Saves a file to the file system.
   * @function putFile
   * @param {string} filePath - The file path.
   * @param {File} file - The file to save.
   * @returns {FileSystem}
   */
  putFile(filePath: string, file: File): FileSystem;
}
/**
 * FILE_SYSTEM_TYPE is an instance of IOType for the FileSystem interface.
 * @constant FILE_SYSTEM_TYPE
 * @type {IOType<FileSystem>}
 */
export const FILE_SYSTEM_TYPE = new IOType<FileSystem>();
