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

  override getNode(path: string): FileSystemNode | null {
    const [firstPart, ...rest] = path.split('/');
    if (firstPart !== this.name) {
      return null;
    }
    if (rest.length === 0) {
      return this;
    }
    for (const child of this.children) {
      const f = child.getNode(rest.join('/'));
      if (f) {
        return f;
      }
    }
    return null;
  }

  override putNode(path: string, node: FileSystemNode): FileSystemNode | null {
    const [firstPart, ...rest] = path.split('/');
    if (firstPart !== this.name) {
      return null;
    }
    if (rest.length === 1) {
      const children = this.children.filter(
        (child) => child instanceof FileSystemFile && child.name === rest[0],
      );
      if (children.length === 0 && node.name === rest[0]) {
        this.addChild(node);
        return node;
      }
      return null;
    }
    const children = this.children.filter(
      (child) => child instanceof FileSystemDirectory && child.name === rest[0],
    );
    if (children.length === 0 && rest[0] != null) {
      const newdir = new FileSystemDirectory(rest[0]);
      this.addChild(newdir);
      return newdir.putNode(rest.join('/'), node);
    }
    for (const child of this.children) {
      const f = child.putNode(rest.join('/'), node);
      if (f) {
        return f;
      }
    }
    return null;
  }

  override addChild(fileSystemNode: FileSystemNode): FileSystemNode | null {
    this.children.push(fileSystemNode);
    return fileSystemNode;
  }
}
