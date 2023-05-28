// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
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
  readJvTestAsset,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateBlockDefinition } from './block-definition';

describe('block-definition validation tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
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

  it('error on unknown block type', async () => {
    const text = readJvTestAsset('block-definition/invalid-unknown-block.jv');

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Unknown block type 'UnknownBlockType'`,
      expect.any(Object),
    );
  });

  it('error on block without pipe', async () => {
    const text = readJvTestAsset('block-definition/invalid-missing-pipe.jv');

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      'A pipe should be connected to the output of this block',
      expect.any(Object),
    );
  });

  it('error on block as output without output', async () => {
    const text = readJvTestAsset(
      'block-definition/invalid-output-block-as-input.jv',
    );

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      'Blocks of type SQLiteLoader do not have an output',
      expect.any(Object),
    );
  });

  it('error on block as input for multiple pipes', async () => {
    const text = readJvTestAsset(
      'block-definition/invalid-block-as-multiple-pipe-inputs.jv',
    );

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      'At most one pipe can be connected to the input of a SQLiteLoader',
      expect.any(Object),
    );
  });

  it('should have no error on valid block definition', async () => {
    const text = readJvTestAsset('block-definition/valid-block-definition.jv');

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@0',
    ) as BlockDefinition;

    validateBlockDefinition(
      block,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
