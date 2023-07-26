// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypes, StdLib } from '@jvalue/jayvee-language-server';
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
  private libraries = new Map<string, Buffer>();

  // The following class members only serve to satisfy the interface:
  private readonly didChangeFile = new EventEmitter<FileChangeEvent[]>();
  onDidChangeFile = this.didChangeFile.event;

  constructor() {
    this.registerBuiltinValuetypes();
    this.registerStdLib();
  }

  private registerStdLib() {
    Object.entries(StdLib).forEach(([libName, lib]) => {
      this.libraries.set(
        Uri.parse(libName).toString(), // removes slashes if missing authorities, required for matching later on
        Buffer.from(lib),
      );
    });
  }

  private registerBuiltinValuetypes() {
    const builtinValuetypeDefinitions: string[] = [];
    Object.values(PrimitiveValuetypes)
      .filter((v) => v.isUserExtendable())
      .forEach((valueType) => {
        // TODO: filter the ones we support!
        builtinValuetypeDefinitions.push(
          `builtin valuetype ${valueType.getName()};`,
        );
      });

    const joinedDocument = builtinValuetypeDefinitions.join('\n');
    const libName = 'builtin:///stdlib/builtin-valuetypes.jv';

    this.libraries.set(
      Uri.parse(libName).toString(),
      Buffer.from(joinedDocument),
    );
  }

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

  stat(uri: Uri): FileStat {
    const libBuffer = this.getLibrary(uri);
    const date = Date.now();
    return {
      ctime: date,
      mtime: date,
      size: libBuffer.length,
      type: FileType.File,
    };
  }

  readFile(uri: Uri): Uint8Array {
    const libBuffer = this.getLibrary(uri);
    return new Uint8Array(libBuffer);
  }

  /**
   * Fetches the library if it exists.
   * Otherwise, throws a FileSystemError.FileNotFound.
   * @returns the library content as Buffer
   */
  private getLibrary(uri: Uri) {
    const libBuffer = this.libraries.get(uri.toString());
    if (libBuffer === undefined) {
      throw FileSystemError.FileNotFound(uri);
    }
    return libBuffer;
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
