// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  columnCharactersAsIndex,
  columnIndexAsCharacters,
} from './column-id-util';

describe('Column ID utils', () => {
  const testValues = new Map<string, number>([
    ['A', 0],
    ['Z', 25],
    ['AA', 26],
    ['BF', 57],
    ['YE', 654],
    ['ZZ', 701],
  ]);

  for (const [letters, index] of testValues.entries()) {
    it(`should convert ${letters} to ${index}`, () => {
      expect(columnCharactersAsIndex(letters)).toStrictEqual(index);
    });

    it(`should convert ${index} to ${letters}`, () => {
      expect(columnIndexAsCharacters(index)).toStrictEqual(letters);
    });
  }
});
