// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { InMemoryFileSystem } from './filesystem-inmemory';
import { FileSystemDirectory } from './filesystem-node-directory';
import { FileExtension, MimeType } from './filesystem-node-file';
import { TextFile } from './filesystem-node-file-text';

describe('InMemoryFileSystem', () => {
  let fileSystem: InMemoryFileSystem;

  beforeEach(() => {
    fileSystem = new InMemoryFileSystem();
  });

  it('returns null when the file does not exist', () => {
    expect(fileSystem.getFile('/non-existent-file')).toBeNull();
  });

  it('returns the file when it exists', () => {
    const file = new TextFile(
      'existing-file',
      FileExtension.TXT,
      MimeType.TEXT_PLAIN,
      ['test'],
    );
    fileSystem.putFile('/existing-file', file);
    expect(fileSystem.getFile('/existing-file')).toEqual(file);
  });

  it('returns null when the path is invalid', () => {
    const file = new TextFile(
      'existing-file',
      FileExtension.TXT,
      MimeType.TEXT_PLAIN,
      ['test'],
    );
    expect(fileSystem.putFile('/invalid/path', file)).toBeNull();
  });

  it('should return file if found using directory manually', () => {
    const root = new FileSystemDirectory('');
    const dir1 = new FileSystemDirectory('dir1');
    const dir2 = new FileSystemDirectory('dir2');
    const file = new TextFile(
      'textfile',
      FileExtension.TXT,
      MimeType.TEXT_PLAIN,
      ['test'],
    );
    dir2.addChild(file);
    dir1.addChild(dir2);
    root.addChild(dir1);
    const f = root.getNode('/dir1/dir2/textfile'.split('/'));
    expect(f).toBe(file);
  });

  it('should return file if putted using directory manually', () => {
    const root = new FileSystemDirectory('');
    const file = new TextFile(
      'textfile',
      FileExtension.TXT,
      MimeType.TEXT_PLAIN,
      ['test'],
    );

    expect(root.putNode('/dir1/dir2/textfile'.split('/'), file)).toBe(file);
    expect(root.getNode('/dir1/dir2/textfile'.split('/'))).toBe(file);
  });
});
