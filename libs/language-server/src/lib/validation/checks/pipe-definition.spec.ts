// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  DefaultOperatorEvaluatorRegistry,
  DefaultOperatorTypeComputerRegistry,
  EvaluationContext,
  PipeDefinition,
  RuntimeParameterProvider,
  ValidationContext,
  WrapperFactory,
  createJayveeServices,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validatePipeDefinition } from './pipe-definition';

describe('Validation of PipeDefinition', () => {
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

  async function parseAndValidatePipe(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const pipe = locator.getAstNode<PipeDefinition>(
      document.parseResult.value,
      'pipelines@0/pipes@0',
    ) as PipeDefinition;

    const operatorEvaluatorRegistry = new DefaultOperatorEvaluatorRegistry();

    validatePipeDefinition(
      pipe,
      new ValidationContext(
        validationAcceptorMock,
        new DefaultOperatorTypeComputerRegistry(),
      ),
      new EvaluationContext(
        new RuntimeParameterProvider(),
        operatorEvaluatorRegistry,
      ),
      new WrapperFactory(operatorEvaluatorRegistry),
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

  describe('PipeDefinition syntax', () => {
    // This test should succeed, because the error is thrown by langium during linking, not during validation!
    it('should have no error even if pipe references non existing block', async () => {
      const text = readJvTestAsset('pipe-definition/valid-undefined-block.jv');

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error even if pipe references block of non existing type', async () => {
      const text = readJvTestAsset(
        'pipe-definition/valid-unknown-blocktype.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on unsupported pipe between Blocktypes', async () => {
      const text = readJvTestAsset(
        'pipe-definition/invalid-pipe-between-blocktypes.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'The output type "File" of block "TestExtractor" (of type "TestFileExtractor") is not compatible with the input type "Table" of block "TestLoader" (of type "TestTableLoader")',
        expect.any(Object),
      );
    });

    it('should diagnose error on connecting loader block to extractor block with a pipe', async () => {
      const text = readJvTestAsset(
        'pipe-definition/invalid-output-block-as-input.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Block "BlockTo" cannot be connected to other blocks. Its blocktype "TestFileLoader" has output type "None".',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Block "BlockFrom" cannot be connected to from other blocks. Its blocktype "TestFileExtractor" has input type "None".',
        expect.any(Object),
      );
    });
  });
});
