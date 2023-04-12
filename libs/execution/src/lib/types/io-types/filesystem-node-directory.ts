// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { FileSystemNode } from './filesystem-node';
import { FileSystemFile } from './filesystem-node-file';

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

  remove(fileSystemNode: FileSystemNode): FileSystemNode {
    const index = this.children.indexOf(fileSystemNode);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    return this;
  }

  findFile(fileName: string): FileSystemNode | undefined {
    for (const child of this.children) {
      if (child instanceof FileSystemFile && child.name === fileName) {
        return child;
      } else if (child instanceof FileSystemDirectory) {
        const file = child.findFile(fileName);
        return file ?? undefined;
      }
    }
    return undefined;
  }

  getChildNode(childName: string): FileSystemNode | undefined {
    for (const child of this.children) {
      if (child.name.toLowerCase() === childName) {
        return child;
      }
    }
    return undefined;
  }
}
