// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { type FileSystem } from './filesystem';
import { FileSystemDirectory } from './filesystem-node-directory';
import { FileSystemFile } from './filesystem-node-file';
import { type IoTypeVisitor } from './io-type-implementation';

export class InMemoryFileSystem implements FileSystem {
  public readonly ioType = IOType.FILE_SYSTEM;

  private rootDirectory: FileSystemDirectory = new FileSystemDirectory('');
  private static PATH_SEPARATOR = '/';
  private static CURRENT_DIR = '.';
  private static PARENT_DIR = '..';

  /**
   * Retrieves a file from the file system. Parent directory indicators (../) are resolved to up to root
   * @function getFile
   * @param {string} path - The absolute path to the file starting with "/..."
   * @returns {FileSystemFile<unknown> | null} - The file or null if the node does not exist.
   */
  getFile(path: string): FileSystemFile<unknown> | null {
    const processedParts = this.processPath(path);
    if (processedParts != null) {
      const node = this.rootDirectory.getNode(processedParts);
      if (node instanceof FileSystemFile) {
        return node;
      }
    }
    return null;
  }

  /**
   * Saves a file to the file system.
   * @function putNode
   * @param {string} path - The absolute path to the file starting with "/..."
   * @param { FileSystemFile<unknown>} file - The file to save.
   * @returns {FileSystem | null} - The FileSystem where file was inserted or null if the file failed to insert
   */
  putFile(path: string, file: FileSystemFile<unknown>): FileSystem | null {
    const processedParts = this.processPath(path);
    if (processedParts != null) {
      const node = this.rootDirectory.putNode(processedParts, file);
      if (node instanceof FileSystemFile) {
        return this;
      }
    }
    return null;
  }

  static getPathSeparator(): string {
    return InMemoryFileSystem.PATH_SEPARATOR;
  }

  private processPath(path: string): string[] | null {
    const [head, ...tail] = path.split(InMemoryFileSystem.getPathSeparator());
    if (!(head === '' || head === InMemoryFileSystem.CURRENT_DIR)) {
      return null;
    }

    const parts = tail.filter((p) => p !== ''); // Process paths like "folder1//folder1" to "folder1/folder2"
    const processedParts: string[] = [];
    for (const part of parts) {
      if (part === InMemoryFileSystem.CURRENT_DIR) {
        continue; // Skip current dirs in path
      }
      if (part === InMemoryFileSystem.PARENT_DIR) {
        const poppedPath = processedParts.pop(); // Go level up in folder hierarchy, max level up is root dir
        // If Path ascend beyond root, error
        if (poppedPath === undefined) {
          return null;
        }
      } else {
        processedParts.push(part);
      }
    }
    // Add path part for root to processedParts and return
    return ['', ...processedParts];
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitFileSystem(this);
  }
}
