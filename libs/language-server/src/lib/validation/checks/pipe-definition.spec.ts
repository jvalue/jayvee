// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type PipeDefinition,
  createJayveeServices,
  isPipeDefinition,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
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

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidatePipe(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allPipes = extractTestElements(document, (x): x is PipeDefinition =>
      isPipeDefinition(x),
    );

    for (const pipe of allPipes) {
      validatePipeDefinition(
        pipe,
        createJayveeValidationProps(validationAcceptorMock, services),
      );
    }
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
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
        'pipe-definition/valid-unknown-block-type.jv',
      );

      await parseAndValidatePipe(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on unsupported pipe between BlockTypes', async () => {
      const text = readJvTestAsset(
        'pipe-definition/invalid-pipe-between-block-types.jv',
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
        'Block "BlockTo" cannot be connected to other blocks. Its block type "TestFileLoader" has output type "None".',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Block "BlockFrom" cannot be connected to from other blocks. Its block type "TestFileExtractor" has input type "None".',
        expect.any(Object),
      );
    });
  });
});
