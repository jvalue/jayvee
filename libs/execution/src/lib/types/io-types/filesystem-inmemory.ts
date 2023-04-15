// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystem } from './filesystem';
import { FileSystemDirectory } from './filesystem-node-directory';
import { FileSystemFile } from './filesystem-node-file';

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
      if (part == null) {
        return null;
      }
      const childNode = currentDir.getChild(part);
      if (!(childNode instanceof FileSystemDirectory)) {
        return null;
      }
      currentDir = childNode;
    }
    const fileName = processedParts[processedParts.length - 1];
    if (fileName == null) {
      return null;
    }

    const childNode = currentDir.getChild(fileName);
    if (childNode instanceof FileSystemFile) {
      return childNode;
    }
    return null;
  }

  putFile(path: string, file: FileSystemFile<unknown>): FileSystem | null {
    const processedParts = this.processPath(path);
    let currentDir = this.rootDirectory;

    for (let i = 0; i < processedParts.length - 1; i++) {
      const part = processedParts[i];
      if (part == null) {
        return null;
      }

      const childNode = currentDir.getChild(part);
      if (!childNode) {
        const newChildNode = new FileSystemDirectory(part);
        currentDir.addChild(newChildNode);
        currentDir = newChildNode;
      } else if (!(childNode instanceof FileSystemDirectory)) {
        return null;
      } else {
        currentDir = childNode;
      }
    }

    const fileName = processedParts[processedParts.length - 1];
    if (fileName == null || fileName !== file.name) {
      return null;
    }

    if (currentDir.addChild(file) == null) {
      return null;
    }
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
