// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { STANDARD_LIBRARY_SOURCECODE } from '@jvalue/jayvee-language-server';
import {
  EventEmitter,
  ExtensionContext,
  FileChangeEvent,
  FileStat,
  FileSystemError,
  FileSystemProvider,
  FileType,
  Uri,
  workspace,
} from 'vscode';

export class StandardLibraryFileSystemProvider implements FileSystemProvider {
  private readonly stdLibraryBuffer = Buffer.from(STANDARD_LIBRARY_SOURCECODE);

  // The following class members only serve to satisfy the interface:
  private readonly didChangeFile = new EventEmitter<FileChangeEvent[]>();
  onDidChangeFile = this.didChangeFile.event;

  static register(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.registerFileSystemProvider(
        'builtin',
        new StandardLibraryFileSystemProvider(),
        {
          isReadonly: true,
          isCaseSensitive: false,
        },
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stat(uri: Uri): FileStat {
    const date = Date.now();
    return {
      ctime: date,
      mtime: date,
      size: this.stdLibraryBuffer.length,
      type: FileType.File,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readFile(uri: Uri): Uint8Array {
    // We could return different libraries based on the URI
    // We have only one, so we always return the same
    return new Uint8Array(this.stdLibraryBuffer);
  }

  watch() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      dispose: () => {},
    };
  }

  readDirectory(): [] {
    throw FileSystemError.NoPermissions();
  }

  createDirectory() {
    throw FileSystemError.NoPermissions();
  }

  writeFile() {
    throw FileSystemError.NoPermissions();
  }

  delete() {
    throw FileSystemError.NoPermissions();
  }

  rename() {
    throw FileSystemError.NoPermissions();
  }
}
