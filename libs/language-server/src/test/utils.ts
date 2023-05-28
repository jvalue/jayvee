// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

import { AstNode, DiagnosticInfo, LangiumDocument } from 'langium';

export const validationAcceptorMockImpl = <N extends AstNode>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  severity: 'error' | 'warning' | 'info' | 'hint',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: DiagnosticInfo<N>,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
) => {};

/**
 * Reads the jv test asset file with the given filename from the test/assets directory
 * @param testFileName asset filename containing jv code
 * @returns content of asset file
 */
export function readJvTestAsset(testFileName: string): string {
  const text = readFileSync(
    path.resolve(__dirname, './assets/', testFileName),
    'utf-8',
  );
  // Expect the test asset to contain something
  expect(text).not.toBe('');
  return text;
}

export function expectNoParserAndLexerErrors(
  document: LangiumDocument<AstNode>,
) {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);
}
