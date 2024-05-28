// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type RegexLiteral,
  createJayveeServices,
  isRegexLiteral,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateRegexLiteral } from './regex-literal';

describe('Validation of RegexLiteral', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateRangeLiteral(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allRegexLiterals = extractTestElements(
      document,
      (x): x is RegexLiteral => isRegexLiteral(x),
    );

    for (const regexLiteral of allRegexLiterals) {
      validateRegexLiteral(
        regexLiteral,
        createJayveeValidationProps(validationAcceptorMock, services),
      );
    }
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;

    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error on valid regex literal', async () => {
    const text = readJvTestAsset('regex-literal/valid-regex-literal.jv');

    await parseAndValidateRangeLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on regex syntax error', async () => {
    const text = readJvTestAsset(
      'regex-literal/invalid-regex-literal-syntax-error.jv',
    );

    await parseAndValidateRangeLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `A parsing error occurred: Invalid regular expression: /a[+/: Unterminated character class`,
      expect.any(Object),
    );
  });
});
