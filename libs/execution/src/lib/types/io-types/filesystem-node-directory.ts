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

  override getNode(pathParts: string[]): FileSystemNode | null {
    const [firstPart, ...rest] = pathParts;
    // Base case: Called a wrong node
    if (firstPart !== this.name) {
      return null;
    }

    // Base case: Called the right node
    if (rest.length === 0) {
      return this;
    }

    // Recursion case: Traverse child nodes
    for (const child of this.children) {
      const f = child.getNode(rest);
      if (f) {
        return f;
      }
    }
    return null;
  }

  override putNode(
    pathParts: string[],
    node: FileSystemNode,
  ): FileSystemNode | null {
    const [firstPart, ...rest] = pathParts;
    if (firstPart !== this.name) {
      return null;
    }
    // Base case: One path part left (which is the filename)
    if (rest.length === 1) {
      if (
        !this.nodeHasAlreadyChildFileWithSameName(rest) &&
        node.name === rest[0]
      ) {
        this.addChild(node);
        return node;
      }
      return null;
    }

    // Case: We need to add directory, because it does not exist
    if (
      !this.nodeHasAlreadyChildDirectoryWithSameName(rest) &&
      rest[0] != null
    ) {
      const newdir = new FileSystemDirectory(rest[0]);
      this.addChild(newdir);
      return newdir.putNode(rest, node);
    }

    // Recursion case: Traverse child nodes
    for (const child of this.children) {
      const f = child.putNode(rest, node);
      if (f) {
        return f;
      }
    }
    return null;
  }

  addChild(fileSystemNode: FileSystemNode): FileSystemNode | null {
    this.children.push(fileSystemNode);
    return fileSystemNode;
  }

  private nodeHasAlreadyChildDirectoryWithSameName(rest: string[]) {
    const children = this.children.filter(
      (child) => child instanceof FileSystemDirectory && child.name === rest[0],
    );
    return children.length !== 0;
  }
  private nodeHasAlreadyChildFileWithSameName(rest: string[]) {
    const children = this.children.filter(
      (child) => child instanceof FileSystemFile && child.name === rest[0],
    );
    return children.length !== 0;
  }

  override toDirectoryString(indentation = 0): string {
    return (
      '\t'.repeat(indentation) +
      this.name +
      '\n' +
      this.children
        .map((child) => child.toDirectoryString(indentation + 2))
        .join('\n')
    );
  }
}
