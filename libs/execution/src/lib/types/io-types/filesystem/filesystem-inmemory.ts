// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FileSystem } from './filesystem';
import { FileSystemDirectory } from './filesystem-directory';
import { FileSystemNode } from './filesystem-node';

export class InMemoryFileSystem extends FileSystem {
  private rootDirectory: FileSystemDirectory = new FileSystemDirectory('root');

  // TODO: Refactor to getFile
  getFileOrDirectory(path: string): FileSystemNode | undefined {
    return this.rootDirectory.find(path);
  }
  putFileOrDirectory(path: string, file: FileSystemNode): FileSystemNode {
    const parentDirectory = this.rootDirectory.find(
      path,
    ) as FileSystemDirectory;
    parentDirectory.add(file);
    return parentDirectory;
  }
}
