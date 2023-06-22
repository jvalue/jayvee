// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

import { AstNode, LangiumDocument, ValidationAcceptor } from 'langium';

import { BlockMetaInformation, IOType } from '../lib';

import { TestLangExtension } from './extension';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const validationAcceptorMockImpl: ValidationAcceptor = () => {};

/**
 * Returns function for reading a jv test asset file from the specified asset root
 * @param assetPath paths to the asset root directory
 * @returns function for reading jv asset file
 */
export function readJvTestAssetHelper(
  ...assetPath: string[]
): (testFileName: string) => string {
  /**
   * Reads the jv test asset file with the given filename from the previously configured asset directory
   * @param testFileName asset filename containing jv code
   * @returns content of asset file
   */
  return (testFileName: string) => {
    const text = readFileSync(
      path.resolve(...assetPath, testFileName),
      'utf-8',
    );
    // Expect the test asset to contain something
    expect(text).not.toBe('');
    return text;
  };
}

export function expectNoParserAndLexerErrors(
  document: LangiumDocument<AstNode>,
) {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);
}

export function getTestExtensionBlockForIOType(
  testExtension: TestLangExtension,
  ioType: IOType,
  io: 'input' | 'output',
): BlockMetaInformation {
  const metaInf = testExtension.constructMetaInformationFromIOType(ioType, io);
  return new metaInf();
}
