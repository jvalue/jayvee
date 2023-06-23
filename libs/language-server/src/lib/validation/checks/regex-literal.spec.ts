// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  RegexLiteral,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateRegexLiteral } from './regex-literal';

describe('Validation of RegexLiteral', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateRangeLiteral(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const regexLiteral = locator.getAstNode<RegexLiteral>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body/properties@0/value',
    ) as RegexLiteral;

    validateRegexLiteral(
      regexLiteral,
      new ValidationContext(validationAcceptorMock),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
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
