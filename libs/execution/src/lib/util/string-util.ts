// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { either } from 'fp-ts';

export function ensureGlobal(regex: RegExp): RegExp {
  if (regex.global) {
    return regex;
  }

  return RegExp(regex.source, regex.flags + 'g');
}

function isSortedAscending(numbers: number[]): boolean {
  return numbers.every((lineIdx, i, arr) => {
    if (i === 0) {
      return true;
    }
    const prev = arr[i - 1];
    assert(prev !== undefined);
    return prev <= lineIdx;
  });
}

function findSingleLineBounds(
  searchIdx: number,
  lineBreakPattern: RegExp,
  text: string,
): { start: number; length: number } | undefined {
  let currentLineIdx = 0;
  let currentLineStart = 0;

  for (const lineBreak of text.matchAll(ensureGlobal(lineBreakPattern))) {
    assert(currentLineIdx <= searchIdx);
    if (currentLineIdx < searchIdx) {
      currentLineIdx += 1;
      currentLineStart += lineBreak.index + 1;
      continue;
    }

    const lineLengthWithoutNewline = lineBreak.index - currentLineStart;
    return {
      start: currentLineStart,
      length: lineLengthWithoutNewline + 1,
    };
  }

  // HINT: Line with idx `lineIdx` not found.
  if (currentLineIdx !== searchIdx) {
    return undefined;
  }
  return {
    start: currentLineStart,
    length: text.length - currentLineStart,
  };
}

type Bounds = { start: number; length: number }[];

/**
 * Map line idxs to line bounds.
 *
 * @param lineIdxs the indices of the lines to find bounds for. MUST be sorted in ASCENDING order.
 * @param lineBreakPattern the pattern that marks a new line.
 * @param text the text containing newlines.
 * @returns a new array which contains either the bounds for the requested line or undefined
 *
 * @example
 * let [{start, length}, outOfBounds ] = findLineBounds("some\ntext\n", /\r?\n/, [0, 300]);
 * assert(inclusiveStart === 0);
 * assert(length === 5);
 * assert(outOfBounds === undefined);
 */
export function findLineBounds(
  lineIdxs: number[],
  lineBreakPattern: RegExp,
  text: string,
): either.Either<
  { existingBounds: Bounds; firstNonExistentLineIdx: number },
  Bounds
> {
  assert(isSortedAscending(lineIdxs));
  let lineIdxOffset = 0;
  let charIdxOffset = 0;

  const bounds: { start: number; length: number }[] = [];

  for (const searchIdx of lineIdxs) {
    if (searchIdx > 0 && text.length === 0) {
      return either.left({
        existingBounds: bounds,
        firstNonExistentLineIdx: searchIdx,
      });
    }
    assert(searchIdx >= lineIdxOffset);
    const tmp = findSingleLineBounds(
      searchIdx - lineIdxOffset,
      lineBreakPattern,
      text,
    );
    if (tmp === undefined) {
      return either.left({
        existingBounds: bounds,
        firstNonExistentLineIdx: searchIdx,
      });
    }

    const { start, length } = tmp;

    bounds.push({
      start: charIdxOffset + start,
      length,
    });

    charIdxOffset += start + length;
    lineIdxOffset = searchIdx + 1;
    text = text.slice(length);
  }

  return either.right(bounds);
}
