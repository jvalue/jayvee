// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ParseHelperOptions,
  validationAcceptorMockImpl,
  readJvTestAssetHelper,
  expectNoParserAndLexerErrors,
  TestLangExtension,
  parseHelper,
} from '@jvalue/jayvee-language-server/test';
import * as assert from 'assert';
import { LangiumDocument, AstNode, AstNodeLocator } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { useExtension } from '../../extension';
import { createJayveeServices } from '../../jayvee-module';

describe('Validation of CompositeBlocktypeDefinition', () => {
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

  async function parseCompositeBlocktypeReferences(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);
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

  it('should have no error on valid model input', async () => {
    const text = readJvTestAsset(
      'composite-blockype-definition/valid-csvextractor.jv',
    );

    parseCompositeBlocktypeReferences(text);
  });
});
