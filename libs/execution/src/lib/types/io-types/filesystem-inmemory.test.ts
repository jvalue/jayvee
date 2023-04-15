// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TextEncoder } from 'util';

import { InMemoryFileSystem } from './filesystem-inmemory';
import { FileExtension, MimeType } from './filesystem-node-file';
import { BinaryFile } from './filesystem-node-file-binary';

describe('InMemoryFileSystem', () => {
  let fileSystem: InMemoryFileSystem;

  beforeEach(() => {
    fileSystem = new InMemoryFileSystem();
  });

  it('should return null if file is not found', () => {
    expect(fileSystem.getFile('file1.txt')).toBe(null);
  });

  it('should return the file if it exists with easy path', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('file1.txt', file);
    expect(fileSystem.getFile('file1.txt')).toBe(file);
  });

  it('should return the file if it exists with complex path', () => {
    const file = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('///asdfasdf/a/file1.txt', file);
    expect(fileSystem.getFile('asdfasdf///a/file1.txt')).toBe(file);
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

  it('should handle path case insensitivity correctly', () => {
    const file1 = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('folder1/file1.txt', file1);
    expect(fileSystem.getFile('folder1/file1.txt')).toBe(file1);

    const file2 = new BinaryFile(
      'File2.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    fileSystem.putFile('Folder1/File2.txt', file2);
    expect(fileSystem.getFile('Folder1/File2.txt')).toBe(file2);
  });

  it("should fail if file's name does not equal filename in path", () => {
    const file1 = new BinaryFile(
      'asdf',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    expect(fileSystem.putFile('folder1/file1.txt', file1)).toBe(null);
    expect(fileSystem.getFile('folder1/file1.txt')).toBe(null);
  });

  it('should felix', () => {
    const file1 = new BinaryFile(
      'file1.txt',
      FileExtension.ZIP,
      MimeType.APPLICATION_OCTET_STREAM,
      new TextEncoder().encode('Test content'),
    );

    expect(fileSystem.putFile('../folder1/file1.txt', file1)).toBe(null);
    expect(fileSystem.getFile('./folder1/file1.txt')).toBe(null);
  });
});
