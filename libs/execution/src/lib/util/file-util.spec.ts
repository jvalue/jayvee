// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '../blocks';
import { FileExtension, MimeType, TextFile } from '../types';

import {
  inferFileExtensionFromContentTypeString,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
  transformTextFileLines,
} from './file-util';

function exampleTextFile(content: string): TextFile {
  return new TextFile(
    'exampleTextFile',
    FileExtension.TXT,
    MimeType.TEXT_PLAIN,
    content,
  );
}

describe('Validation of file-util', () => {
  describe('Function inferMimeTypeFromContentTypeString', () => {
    it('should diagnose no error on known mimeType', () => {
      const result = inferMimeTypeFromFileExtensionString('txt');

      expect(result).toEqual(MimeType.TEXT_PLAIN);
    });
    it('should diagnose no error on undefined input', () => {
      const result = inferMimeTypeFromFileExtensionString(undefined);

      expect(result).toEqual(undefined);
    });
    it('should diagnose no error on unknown mimeType', () => {
      const result = inferMimeTypeFromFileExtensionString('unity');

      expect(result).toEqual(undefined);
    });
  });
  describe('Function inferFileExtensionFromFileExtensionString', () => {
    it('should diagnose no error on valid file extension', () => {
      const result = inferFileExtensionFromFileExtensionString('txt');

      expect(result).toEqual(FileExtension.TXT);
    });
    it('should diagnose no error on valid file extension starting with .', () => {
      const result = inferFileExtensionFromFileExtensionString('.txt');

      expect(result).toEqual(FileExtension.TXT);
    });
    it('should diagnose no error on undefined input', () => {
      const result = inferFileExtensionFromFileExtensionString(undefined);

      expect(result).toEqual(undefined);
    });
    it('should diagnose no error on unknown file extension', () => {
      const result = inferFileExtensionFromFileExtensionString('unity');

      expect(result).toEqual(undefined);
    });
  });
  describe('Function inferFileExtensionFromContentTypeString', () => {
    it('should diagnose no error on valid content type', () => {
      const result = inferFileExtensionFromContentTypeString('text/csv');

      expect(result).toEqual(FileExtension.CSV);
    });
    it('should diagnose no error on undefined input', () => {
      const result = inferFileExtensionFromContentTypeString(undefined);

      expect(result).toEqual(undefined);
    });
    it('should diagnose no error on unknown content type', () => {
      const result =
        inferFileExtensionFromContentTypeString('application/unity');

      expect(result).toEqual(undefined);
    });
  });
  describe('Function transformTextFileLines', () => {
    it('should diagnose no error without newline', async () => {
      const file = exampleTextFile('some text content without a newline');
      // eslint-disable-next-line @typescript-eslint/require-await
      const spy = vi.fn(async (lines: string[]) => R.ok(lines));
      const result = await transformTextFileLines(file, /\r?\n/, spy);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenLastCalledWith([
        'some text content without a newline',
      ]);

      expect(R.isOk(result)).toBe(true);
      assert(R.isOk(result));

      expect(result.right).toStrictEqual(file);
    });
    it('should diagnose no error on empty file', async () => {
      const file = exampleTextFile('');

      // eslint-disable-next-line @typescript-eslint/require-await
      const spy = vi.fn(async (lines: string[]) => R.ok(lines));
      const result = await transformTextFileLines(file, /\r?\n/, spy);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenLastCalledWith([]);

      expect(R.isOk(result)).toBe(true);
      assert(R.isOk(result));

      expect(result.right).toStrictEqual(file);
    });
    it('should diagnose no error on file with trailing newline', async () => {
      const file = exampleTextFile(`some text content
with a 
trailing newline
`);
      // eslint-disable-next-line @typescript-eslint/require-await
      const spy = vi.fn(async (lines: string[]) => R.ok(lines));
      const result = await transformTextFileLines(file, /\r?\n/, spy);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenLastCalledWith([
        'some text content',
        'with a ',
        'trailing newline',
      ]);

      expect(R.isOk(result)).toBe(true);
      assert(R.isOk(result));

      expect(result.right).toStrictEqual(file);
    });
  });
});
