// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type RangeLiteral,
  createJayveeServices,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateRangeLiteral } from './range-literal';

describe('Validation of RangeLiteral', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateRangeLiteral(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const rangeLiteral = locator.getAstNode<RangeLiteral>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body/properties@0/value',
    ) as RangeLiteral;

    validateRangeLiteral(
      rangeLiteral,
      createJayveeValidationProps(validationAcceptorMock, services),
    );
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error on valid range literal', async () => {
    const text = readJvTestAsset('range-literal/valid-range-literal.jv');

    await parseAndValidateRangeLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on wrong range direction', async () => {
    const text = readJvTestAsset(
      'range-literal/invalid-range-literal-start-after-end.jv',
    );

    await parseAndValidateRangeLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Cell ranges need to be spanned from top-left to bottom-right`,
      expect.any(Object),
    );
  });

  it('should have no error on unlimited range', async () => {
    const text = readJvTestAsset(
      'range-literal/valid-range-literal-unlimited-range.jv',
    );

    await parseAndValidateRangeLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
