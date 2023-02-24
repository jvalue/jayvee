import { IOType } from '@jayvee/language-server';

import { File } from './file';
import { IOTypeImplementation } from './io-type-implementation';

/**
 * FileSystem interface defines the operations that a file system implementation should have.
 * @interface FileSystem
 */
export interface FileSystem extends IOTypeImplementation<IOType.FILE_SYSTEM> {
  /**
   * Retrieves a file from the file system.
   * @function getFile
   * @param {string} filePath - The file path.
   * @returns {File} - The file or null if the file does not exist.
   */
  getFile(filePath: string): File | null;

  /**
   * Saves a file to the file system.
   * @function putFile
   * @param {string} filePath - The file path.
   * @param {File} file - The file to save.
   * @returns {FileSystem}
   */
  putFile(filePath: string, file: File): FileSystem;
}
