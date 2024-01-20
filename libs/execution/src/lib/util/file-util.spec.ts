// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FileExtension, MimeType } from '../types';

import {
  inferFileExtensionFromContentTypeString,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
} from './file-util';

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
});
