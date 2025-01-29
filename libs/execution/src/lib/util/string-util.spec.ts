// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { AssertionError } from 'assert';

import { either } from 'fp-ts';

import { ensureGlobal, findLineBounds } from './string-util';

describe('Validation of string-util', () => {
  describe('Function ensureGlobal', () => {
    it('should make a non global RegExp global', () => {
      const result = ensureGlobal(/someregex/);

      expect(result.global).toBe(true);
      expect(result.source).toBe('someregex');
    });
    it('should keep a global RegExp global', () => {
      const result = ensureGlobal(/someregex/g);

      expect(result.global).toBe(true);
      expect(result.source).toBe('someregex');
    });
  });
  describe('Function findLineBounds', () => {
    it('should return empty array for empty array', () => {
      const result = findLineBounds([], /\r?\n/, 'some text');

      expect(either.isRight(result)).toBe(true);
      assert(either.isRight(result));
      expect(result.right).toStrictEqual([]);
    });
    it('should return first non existent lineIdx', () => {
      const result = findLineBounds(
        [0, 30, 300],
        /\r?\n/,
        `some text

`,
      );

      expect(either.isLeft(result)).toBe(true);
      assert(either.isLeft(result));
      expect(result.left.firstNonExistentLineIdx).toBe(30);
      expect(result.left.existingBounds).toStrictEqual([
        { start: 0, length: 10 },
      ]);
    });
    it('should return the entire string if there is no newline', () => {
      const result = findLineBounds(
        [0, 1],
        /\r?\n/,
        'some text without a newline',
      );

      expect(either.isLeft(result)).toBe(true);
      assert(either.isLeft(result));
      expect(result.left.firstNonExistentLineIdx).toBe(1);
      expect(result.left.existingBounds).toStrictEqual([
        { start: 0, length: 27 },
      ]);
    });
    it('should correctly map multiple indices', () => {
      const result = findLineBounds(
        [0, 1, 2, 3],
        /\r?\n/,
        `some
text  with
newlines
`,
      );

      expect(either.isLeft(result)).toBe(true);
      assert(either.isLeft(result));
      expect(result.left.firstNonExistentLineIdx).toBe(3);
      expect(result.left.existingBounds).toStrictEqual([
        { start: 0, length: 5 },
        { start: 5, length: 11 },
        { start: 16, length: 9 },
      ]);
    });
    it('should throw an error on out of order indices', () => {
      expect(() => findLineBounds([1, 0], /\r?\n/, '')).toThrowError(
        AssertionError,
      );
    });
  });
});
