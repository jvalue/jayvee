// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PipeDefinition,
  ValidationContext,
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

    validatePipeDefinition(pipe, new ValidationContext(validationAcceptorMock));
  }

  beforeAll(() => {
    // TODO: fix tests after removing TestExtension

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

  describe('SinglePipeDefinition syntax', () => {
    // This test should succeed, because the error is thrown by langium during linking, not during validation!
    it('should have no error even if pipe references non existing block', async () => {
      const text = readJvTestAsset(
        'pipe-definition/single/valid-undefined-block.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error even if pipe references block of non existing type', async () => {
      const text = readJvTestAsset(
        'pipe-definition/single/valid-unknown-blocktype.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on unsupported pipe between Blocktypes', async () => {
      const text = readJvTestAsset(
        'pipe-definition/single/invalid-pipe-between-blocktypes.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The output type "File" of TestFileExtractor is incompatible with the input type "Table" of TestTableLoader`,
        expect.any(Object),
      );
    });
  });

  describe('ChainedPipeDefinition syntax', () => {
    // This test should succeed, because the error is thrown by langium during linking, not during validation!
    it('should have no error even if pipe references non existing block', async () => {
      const text = readJvTestAsset(
        'pipe-definition/chained/valid-undefined-block.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error even if pipe references block of non existing type', async () => {
      const text = readJvTestAsset(
        'pipe-definition/chained/valid-unknown-blocktype.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on unsupported pipe between Blocktypes', async () => {
      const text = readJvTestAsset(
        'pipe-definition/chained/invalid-pipe-between-blocktypes.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The output type "File" of TestFileExtractor is incompatible with the input type "Table" of TestTableLoader`,
        expect.any(Object),
      );
    });
  });
});
