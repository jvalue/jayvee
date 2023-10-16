// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export function splitLines(textContent: string, lineBreak: RegExp): string[] {
  const lines = textContent.split(lineBreak);

  // There may be an additional empty line due to the previous splitting
  if (lines[lines.length - 1] === '') {
    lines.splice(lines.length - 1, 1);
  }

  return lines;
}
