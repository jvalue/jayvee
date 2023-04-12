// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystemFile } from './filesystem-node-file';
import { BinaryFile } from './filesystem-node-file-binary';
import { IOTypeImplementation } from './io-type-implementation';

/**
 * FileSystem interface defines the operations that a file system implementation should have.
 * @interface FileSystem
 */
export interface FileSystem extends IOTypeImplementation<IOType.FILE_SYSTEM> {
  /**
   * Retrieves a node from the file system. Depends on the implementation of the file system a node could be File or Directory.
   * @function getNode
   * @param {string} path - The path to the node.
   * @returns {FileSystemNode | undefined} - The node or null if the node does not exist.
   */
  getFile(path: string): FileSystemFile<unknown> | null;

  /**
   * Saves a file to the file system.  Depends on the implementation of the file system a node could be File or Directory.
   * @function putNode
   * @param {string} path - The path to the node.
   * @param {FileSystemNode} node - The node to save.
   * @returns {FileSystem}
   */
  putFile(path: string, file: BinaryFile): FileSystem | null;
}
