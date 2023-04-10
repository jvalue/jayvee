// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { FileSystemFile } from './filesystem-file';
import { FileSystemNode } from './filesystem-node';

export class FileSystemDirectory extends FileSystemNode {
  private children: FileSystemNode[] = [];
  constructor(public override name: string) {
    super(name);
  }

  override getNodeSize(): number {
    return this.children.reduce(
      (totalSize, child) => totalSize + child.getNodeSize(),
      0,
    );
  }

  add(fileSystemNode: FileSystemNode) {
    this.children.push(fileSystemNode);
  }

  remove(fileSystemNode: FileSystemNode) {
    const index = this.children.indexOf(fileSystemNode);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  find(path: string): FileSystemNode | undefined {
    return this.children.find((child) => child.name === path);
  }

  findRecursive(path: string): FileSystemNode | undefined {
    if (path === '') {
      return this;
    }

    const [currentName, ...rest] = path.split('/');
    const child = this.children.find((child) => child.name === currentName);

    if (child instanceof FileSystemFile) {
      return child;
    }

    if (child instanceof FileSystemDirectory) {
      return child.findRecursive(rest.join('/'));
    }
    return undefined;
  }
}
