// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type PipelineDefinition,
  createJayveeServices,
  isPipelineDefinition,
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

import { validatePipelineDefinition } from './pipeline-definition';

describe('Validation of PipelineDefinition', () => {
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

  async function parseAndValidatePipeline(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allPipelines = extractTestElements(
      document,
      (x): x is PipelineDefinition => isPipelineDefinition(x),
    );

    for (const pipeline of allPipelines) {
      validatePipelineDefinition(
        pipeline,
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

  it('should diagnose error on missing starting block (no blocks)', async () => {
    const text = readJvTestAsset(
      'pipeline-definition/invalid-empty-pipeline.jv',
    );

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `An extractor block is required for this pipeline`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing starting block (no pipes)', async () => {
    const text = readJvTestAsset(
      'pipeline-definition/invalid-pipeline-only-blocks.jv',
    );

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2); // one warning for unused blocks
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `An extractor block is required for this pipeline`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'warning',
      `A pipe should be connected to the output of this block`,
      expect.any(Object),
    );
  });

  it('should have no error on valid pipeline', async () => {
    const text = readJvTestAsset('pipeline-definition/valid-pipeline.jv');

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on block as input for multiple pipes', async () => {
    const text = readJvTestAsset(
      'pipeline-definition/invalid-block-as-multiple-pipe-inputs.jv',
    );

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      'At most one pipe can be connected to the input of a block. Currently, the following 2 blocks are connected via pipes: "BlockFrom1", "BlockFrom2"',
      expect.any(Object),
    );
  });

  it('should diagnose error on block without pipe', async () => {
    const text = readJvTestAsset('pipeline-definition/invalid-missing-pipe.jv');

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2); // one error since missing extractor
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'warning',
      'A pipe should be connected to the output of this block',
      expect.any(Object),
    );
  });
});
