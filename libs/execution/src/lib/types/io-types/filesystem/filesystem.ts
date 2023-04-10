// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { IOTypeImplementation } from '../io-type-implementation';

import { FileSystemNode } from './filesystem-node';

/**
 * FileSystem interface defines the operations that a file system implementation should have.
 * @interface FileSystem
 */
export abstract class FileSystem
  implements IOTypeImplementation<IOType.FILE_SYSTEM_NODE>
{
  public readonly ioType = IOType.FILE_SYSTEM_NODE;
  /**
   * Retrieves a file from the file system.
   * @function getFile
   * @param {string} filePath - The file path.
   * @returns {File} - The file or null if the file does not exist.
   */
  abstract getFileOrDirectory(path: string): FileSystemNode | undefined;

  /**
   * Saves a file to the file system.
   * @function putFile
   * @param {string} filePath - The file path.
   * @param {File} file - The file to save.
   * @returns {FileSystem}
   */
  abstract putFileOrDirectory(
    filePath: string,
    file: FileSystemNode,
  ): FileSystemNode;
}
