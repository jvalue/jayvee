// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
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
  extractPipeline,
  parseHelper,
  validationAcceptorMockImpl,
} from '../../../test';

describe('pipeline-definition validation tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('error on missing extractor block', async () => {
    const text = `
    pipeline Test {
    }
    `;

    const parseResult = await parse(text);

    const pipeline: PipelineDefinition = extractPipeline(parseResult);

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
    const text = `
    pipeline Test {
      block CarsExtractor oftype HttpExtractor {
        url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
      }
    }
    `;

    const parseResult = await parse(text);

    const pipeline: PipelineDefinition = extractPipeline(parseResult);

    validatePipelineDefinition(
      pipeline,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
