// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  RuntimeParameterProvider,
  ValidationContext,
  ValuetypeDefinition,
  createJayveeServices,
  useExtension,
} from '../..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateValuetypeDefinition } from './valuetype-definition';

describe('Validation of ValuetypeReference', () => {
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

  async function parseAndValidateValuetypeDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const valuetypeDefinition = locator.getAstNode<ValuetypeDefinition>(
      document.parseResult.value,
      'valuetypes@0',
    ) as ValuetypeDefinition;

    validateValuetypeDefinition(
      valuetypeDefinition,
      new ValidationContext(validationAcceptorMock),
      new EvaluationContext(new RuntimeParameterProvider()),
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

  it('should have no error on reference to non-generic valuetype', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-non-generic-valuetype.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on reference to generic valuetype with single generic', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-single-generic-valuetype.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on reference to generic valuetype with multiple generics', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-multiple-generic-valuetype.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
