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
  type CompositeBlockTypeDefinition,
  type JayveeServices,
  createJayveeServices,
} from '../..';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateCompositeBlockTypeDefinition } from './composite-block-type-definition';

describe('Validation of CompositeBlockTypeDefinition', () => {
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

  async function parseAndValidateBlockType(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const blockType = locator.getAstNode<CompositeBlockTypeDefinition>(
      document.parseResult.value,
      'blockTypes@0',
    ) as CompositeBlockTypeDefinition;

    validateCompositeBlockTypeDefinition(
      blockType,
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

  it('should diagnose error on missing pipeline in composite block type', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/invalid-composite-block-type-no-pipeline.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Composite block types must define one pipeline 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple pipelines in composite block type', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/invalid-composite-block-type-multiple-pipelines.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one pipeline definition in composite block type 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should have no error on valid extractor block type definition', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/valid-composite-block-type-extractor.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid extractor block type definition using recursion', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/valid-composite-block-type-recursive.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on block as input for multiple pipes', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/invalid-block-as-multiple-pipe-inputs.jv',
    );

    await parseAndValidateBlockType(text);

    // first 2 errors for multiple pipelines in test file
    expect(validationAcceptorMock).toHaveBeenCalledTimes(4);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      3,
      'error',
      'At most one pipe can be connected to the input of a block. Currently, the following 2 blocks are connected via pipes: "BlockFrom1", "BlockFrom2"',
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      4,
      'error',
      'At most one pipe can be connected to the input of a block. Currently, the following 2 blocks are connected via pipes: "BlockFrom1", "BlockFrom2"',
      expect.any(Object),
    );
  });

  it('should diagnose error on block without pipe', async () => {
    const text = readJvTestAsset(
      'composite-block-type-definition/invalid-unconnected-block.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      'A pipe should be connected to the input of this block',
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'warning',
      'A pipe should be connected to the output of this block',
      expect.any(Object),
    );
  });
});
