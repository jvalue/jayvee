// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { TestLangExtension } from '../../../test/extension';
import { ParseHelperOptions, parseHelper } from '../../../test/langium-utils';
import {
  expectNoParserAndLexerErrors,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test/utils';
import { useExtension } from '../../extension';
import { createJayveeServices } from '../../jayvee-module';

describe('Validation of CompositeBlocktypeDefinition', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseCompositeBlocktypeReferences(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error on valid model input', async () => {
    const text = readJvTestAsset(
      'composite-blockype-definition/valid-csvextractor.jv',
    );

    await parseCompositeBlocktypeReferences(text);
  });
});
