// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PipelineDefinition,
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

import { validatePipelineDefinition } from './pipeline-definition';

describe('Validation of PipelineDefinition', () => {
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

  async function parseAndValidatePipeline(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const pipeline = locator.getAstNode<PipelineDefinition>(
      document.parseResult.value,
      'pipelines@0',
    ) as PipelineDefinition;

    validatePipelineDefinition(
      pipeline,
      new ValidationContext(validationAcceptorMock),
    );
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

  it('should diagnose error on missing extractor block', async () => {
    const text = readJvTestAsset(
      'pipeline-definition/invalid-empty-pipeline.jv',
    );

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `An extractor block is required for this pipeline`,
      expect.any(Object),
    );
  });

  it('should have no error on valid pipeline', async () => {
    const text = readJvTestAsset('pipeline-definition/valid-pipeline.jv');

    await parseAndValidatePipeline(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
