// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/language-server';

import { BinaryFile } from './binary-file';
import { FileSystem } from './filesystem';

export class InMemoryFileSystem implements FileSystem {
  public readonly ioType = IOType.FILE_SYSTEM;

  private static PATH_SEPARATOR = '/';
  private static CURRENT_DIR = '.';
  private static PARENT_DIR = '..';

  // Hierachical file system
  private fileSystemIndex: Map<string, BinaryFile | FileSystem> = new Map();

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

  getFile(filePath: string): BinaryFile | null {
    const processedParts = this.processPath(filePath);

    // If we have a minimum valid path
    if (processedParts.length > 0) {
      let currentFileSystemIndex = this.fileSystemIndex;

      // Get the name of the requested file
      const fileName = processedParts[processedParts.length - 1] as string;

      // If we have a directory, we traverse it, if not (processedParts == 1) skip the travesal
      for (let i = 0; i < processedParts.length - 1; i++) {
        const childFileSystem = currentFileSystemIndex.get(
          processedParts[i] as string,
        ) as InMemoryFileSystem | undefined;

        // If we dont find current path-part, stop methodcall
        if (!childFileSystem) {
          return null;
        }
        currentFileSystemIndex = childFileSystem.fileSystemIndex;
      }

      // If we are in the correct directory
      const file = currentFileSystemIndex.get(fileName) as
        | BinaryFile
        | undefined;
      return file === undefined ? null : file;
    }
    return null;
  }

  putFile(filePath: string, file: BinaryFile): FileSystem {
    const processedParts = this.processPath(filePath);
    let currentFileSystemIndex = this.fileSystemIndex;

    // If we need to traverse
    for (let i = 0; i < processedParts.length - 1; i++) {
      const part: string = processedParts[i] as string;

      // Check, if directory already exists, if not create it
      let childFileSystemIndex = currentFileSystemIndex.get(part) as
        | InMemoryFileSystem
        | undefined;
      if (!childFileSystemIndex) {
        childFileSystemIndex = new InMemoryFileSystem();
        currentFileSystemIndex.set(part, childFileSystemIndex);
      }
      currentFileSystemIndex = childFileSystemIndex.fileSystemIndex;
    }

    // Safe the actual file
    currentFileSystemIndex.set(
      processedParts[processedParts.length - 1] as string,
      file,
    );
    return this;
  }
}
