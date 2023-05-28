// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PipelineDefinition,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validatePipelineDefinition } from '../../../lib/validation/checks/pipeline-definition';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAsset,
  validationAcceptorMockImpl,
} from '../../../test';

describe('pipeline-definition validation tests', () => {
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

  it('error on missing extractor block', async () => {
    const text = readJvTestAsset(
      'pipeline-definition/invalid-empty-pipeline.jv',
    );

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const pipeline = locator.getAstNode<PipelineDefinition>(
      document.parseResult.value,
      'pipelines@0',
    ) as PipelineDefinition;

    validatePipelineDefinition(
      pipeline,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `An extractor block is required for this pipeline`,
      expect.any(Object),
    );
  });

  it('should have no error on valid pipeline', async () => {
    const text = readJvTestAsset('pipeline-definition/valid-pipeline.jv');

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);

    const pipeline = locator.getAstNode<PipelineDefinition>(
      document.parseResult.value,
      'pipelines@0',
    ) as PipelineDefinition;

    validatePipelineDefinition(
      pipeline,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
