// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

const firstCharacter = 'A';
const lastCharacter = 'Z';
const characterOffset = firstCharacter.charCodeAt(0);
const numberOfCharacters = lastCharacter.charCodeAt(0) - characterOffset + 1;

export function columnIndexAsCharacters(columnIndex: number): string {
  let columnCharacters = '';
  let value = columnIndex + 1;
  do {
    const remainder = value % numberOfCharacters;
    let quotient = Math.floor(value / numberOfCharacters);
    if (remainder !== 0) {
      columnCharacters =
        String.fromCharCode(remainder + characterOffset - 1) + columnCharacters;
    } else {
      --quotient;
      columnCharacters = lastCharacter + columnCharacters;
    }
    value = quotient;
  } while (value > 0);
  return columnCharacters;
}

export function columnCharactersAsIndex(columnCharacters: string): number {
  let columnIndex = 0;
  for (let position = 0; position < columnCharacters.length; ++position) {
    const charCode = columnCharacters.charCodeAt(position);
    const characterIndex = charCode - characterOffset + 1;
    const factor = Math.pow(
      numberOfCharacters,
      columnCharacters.length - 1 - position,
    );
    columnIndex += characterIndex * factor;
  }
  return columnIndex - 1;
}
