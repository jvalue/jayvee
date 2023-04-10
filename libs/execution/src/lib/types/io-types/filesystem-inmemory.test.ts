// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TextEncoder } from 'util';

import { FileExtension, MimeType } from './filesystem-file';
import { BinaryFile } from './filesystem-file-binary';
import { InMemoryFileSystem } from './filesystem-inmemory';

describe('InMemoryFileSystem', () => {
  let fileSystem: InMemoryFileSystem;

  beforeEach(() => {
    fileSystem = new InMemoryFileSystem();
  });

  it('should return null if file is not found', () => {
    expect(fileSystem.getFile('file1.txt')).toBe(null);
  });

  it('should return the file if it exists', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('file1.txt', file);
    expect(fileSystem.getFile('file1.txt')).toBe(file);
  });

  it('should return null if directory does not exist', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('folder1/file1.txt', file);
    expect(fileSystem.getFile('folder2/file1.txt')).toBe(null);
  });

  it('should handle relative paths correctly', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('folder1/file1.txt', file);
    expect(fileSystem.getFile('./folder1/file1.txt')).toBe(file);
    expect(fileSystem.getFile('folder1/../folder1/file1.txt')).toBe(file);
  });

  it('should handle path case sensitivity correctly', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('folder1/file1.txt', file);
    expect(fileSystem.getFile('Folder1/File1.txt')).toBe(file);
  });
});
