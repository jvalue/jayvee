// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystem } from './filesystem';
import { FileSystemDirectory } from './filesystem-directory';
import { BinaryFile } from './filesystem-file-binary';

export class InMemoryFileSystem implements FileSystem {
  public readonly ioType = IOType.FILE_SYSTEM;

  private rootDirectory: FileSystemDirectory = new FileSystemDirectory('root');
  private static PATH_SEPARATOR = '/';
  private static CURRENT_DIR = '.';
  private static PARENT_DIR = '..';

  getFile(path: string): BinaryFile | null {
    const node = this.rootDirectory.findRecursive(
      this.processPath(path).join('/'),
    );
    console.log(node);
    if (node instanceof FileSystemDirectory) {
      return null;
    } else if (node instanceof BinaryFile) {
      return node;
    }
    return null;
  }

  putFile(path: string, file: BinaryFile): FileSystem {
    const processedParts = this.processPath(path);
    let currentDir = this.rootDirectory;

    // If we need to traverse
    for (let i = 0; i < processedParts.length; i++) {
      const part: string = processedParts[i] as string;

      // Check, if directory already exists, if not create it
      let childNode = currentDir.find(part);
      if (!childNode) {
        childNode = new FileSystemDirectory(part);
        currentDir.add(childNode);
      }
      if (childNode instanceof FileSystemDirectory) {
        currentDir = childNode;
      }
    }
    // Safe the actual file
    currentDir.add(file);
    return this;
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
