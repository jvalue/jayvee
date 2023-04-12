// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystem } from './filesystem';
import { FileSystemDirectory } from './filesystem-node-directory';
import { FileSystemFile } from './filesystem-node-file';
import { BinaryFile } from './filesystem-node-file-binary';

export class InMemoryFileSystem implements FileSystem {
  public readonly ioType = IOType.FILE_SYSTEM;

  private rootDirectory: FileSystemDirectory = new FileSystemDirectory('root');
  private static PATH_SEPARATOR = '/';
  private static CURRENT_DIR = '.';
  private static PARENT_DIR = '..';

  getFile(path: string): FileSystemFile<unknown> | null {
    const processedParts = this.processPath(path);
    let currentDir = this.rootDirectory;

    // Loop until we reach the last part of processedParts
    for (let i = 0; i < processedParts.length - 1; i++) {
      const part = processedParts[i];

      // If part exists
      if (part != null) {
        const childNode = currentDir.getChildNode(part);
        if (childNode instanceof FileSystemDirectory) {
          currentDir = childNode;
        } else {
          return null;
        }
      }
    }
    // If file exists, return
    const child = currentDir.getChildNode(processedParts.pop() ?? '');
    if (child !== undefined && child instanceof FileSystemFile) {
      return child;
    }
    return null;
  }

  putFile(path: string, file: BinaryFile): FileSystem | null {
    const processedParts = this.processPath(path);
    let currentDir = this.rootDirectory;

    // Loop until we reach the last part of processedParts
    for (let i = 0; i < processedParts.length - 1; i++) {
      const part = processedParts[i];

      // If part exists
      if (part != null) {
        let childNode = currentDir.getChildNode(part);

        // If dir exists --> traverse
        if (childNode && childNode instanceof FileSystemDirectory) {
          currentDir = childNode;
        } else if (childNode && childNode instanceof FileSystemFile) {
          return null;

          // If dir NOT exists --> create new
        } else {
          childNode = new FileSystemDirectory(part);
          currentDir.add(childNode);
          currentDir = childNode as FileSystemDirectory;
        }
      }
    }

    // If Nodename is not already there --> put file to dir
    const child = currentDir.getChildNode(processedParts.pop() ?? '');
    if (child instanceof FileSystemDirectory || child === undefined) {
      currentDir.add(file);
    }
    return null;
  }

  private processPath(path: string): string[] {
    const parts = path
      .toLowerCase()
      .split(InMemoryFileSystem.PATH_SEPARATOR)
      .filter((p) => p !== ''); // Process paths like "folder1//folder1" to "folder1/folder2"
    const processedParts: string[] = [];
    for (const part of parts) {
      if (part === InMemoryFileSystem.CURRENT_DIR) {
        continue; // Skip current dirs in path
      }
      if (part === InMemoryFileSystem.PARENT_DIR) {
        processedParts.pop(); // Go level up in folder hierarchy if ..
      } else {
        processedParts.push(part);
      }
    }
    return processedParts;
  }
}
