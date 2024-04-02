// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  CompositeBlocktypeDefinition,
  DefaultOperatorEvaluatorRegistry,
  DefaultOperatorTypeComputerRegistry,
  EvaluationContext,
  RuntimeParameterProvider,
  ValidationContext,
  createJayveeServices,
} from '../..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateCompositeBlockTypeDefinition } from './composite-blocktype-definition';

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

  async function parseAndValidateBlocktype(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const blocktype = locator.getAstNode<CompositeBlocktypeDefinition>(
      document.parseResult.value,
      'blocktypes@0',
    ) as CompositeBlocktypeDefinition;

    validateCompositeBlockTypeDefinition(
      blocktype,
      new ValidationContext(
        validationAcceptorMock,
        new DefaultOperatorTypeComputerRegistry(),
      ),
      new EvaluationContext(
        new RuntimeParameterProvider(),
        new DefaultOperatorEvaluatorRegistry(),
      ),
    );
  }

  beforeAll(() => {
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

  it('should diagnose error on missing pipeline in composite blocktype', async () => {
    const text = readJvTestAsset(
      'composite-blocktype-definition/invalid-composite-blocktype-no-pipeline.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Composite blocktypes must define one pipeline 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple pipelines in composite blocktype', async () => {
    const text = readJvTestAsset(
      'composite-blocktype-definition/invalid-composite-blocktype-multiple-pipelines.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one pipeline definition in composite blocktype 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should have no error on valid extractor blocktype definition', async () => {
    const text = readJvTestAsset(
      'composite-blocktype-definition/valid-composite-blocktype-extractor.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid extractor blocktype definition using recursion', async () => {
    const text = readJvTestAsset(
      'composite-blocktype-definition/valid-composite-blocktype-recursive.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on block as input for multiple pipes', async () => {
    const text = readJvTestAsset(
      'composite-blocktype-definition/invalid-block-as-multiple-pipe-inputs.jv',
    );

    await parseAndValidateBlocktype(text);

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
      'composite-blocktype-definition/invalid-unconnected-block.jv',
    );

    await parseAndValidateBlocktype(text);

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
