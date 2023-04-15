// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { FileSystemNode } from './filesystem-node';

export class FileSystemDirectory extends FileSystemNode {
  private children: FileSystemNode[] = [];
  constructor(public override name: string) {
    super(name);
  }

  addChild(fileSystemNode: FileSystemNode): FileSystemNode | null {
    if (this.childNodeAlreadyExists(fileSystemNode)) {
      return null;
    }
    this.children.push(fileSystemNode);
    return fileSystemNode;
  }

  getChild(childName: string): FileSystemNode | null {
    for (const child of this.children) {
      if (child.name === childName) {
        return child;
      }
    }
    return null;
  }

  private childNodeAlreadyExists(fileSystemNode: FileSystemNode): boolean {
    const childsWithSameName = this.children.filter(
      (child) => child.name === fileSystemNode.name,
    );
    return childsWithSameName.length > 0;
  }
}
