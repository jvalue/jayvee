// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  BlockDefinition,
  ValidationContext,
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

import { validateBlockDefinition } from './block-definition';

describe('Validation of BlockDefinition', () => {
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

  async function parseAndValidateBlock(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
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

  it('should diagnose error on block without pipe', async () => {
    const text = readJvTestAsset('block-definition/invalid-missing-pipe.jv');

    await parseAndValidateBlock(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      'A pipe should be connected to the output of this block',
      expect.any(Object),
    );
  });

  it('should diagnose error on block as output without having an output', async () => {
    const text = readJvTestAsset(
      'block-definition/invalid-output-block-as-input.jv',
    );

    await parseAndValidateBlock(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      'Blocks of type TestTableLoader do not have an output',
      expect.any(Object),
    );
  });

  it('should diagnose error on block as input for multiple pipes', async () => {
    const text = readJvTestAsset(
      'block-definition/invalid-block-as-multiple-pipe-inputs.jv',
    );

    await parseAndValidateBlock(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      'At most one pipe can be connected to the input of a TestTableLoader',
      expect.any(Object),
    );
  });

  it('should have no error on valid block definition', async () => {
    const text = readJvTestAsset('block-definition/valid-block-definition.jv');

    await parseAndValidateBlock(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
