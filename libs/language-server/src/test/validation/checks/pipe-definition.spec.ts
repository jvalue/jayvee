// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PipeDefinition,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validatePipeDefinition } from '../../../lib/validation/checks/pipe-definition';
import {
  ParseHelperOptions,
  extractPipe,
  parseHelper,
  validationAcceptorMockImpl,
} from '../../utils';

describe('pipe-definition validation tests', () => {
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

  describe('single pipe', () => {
    // This test should succeed, because the error is thrown by langium during linking, not during validation!
    it('should have no error even if pipe references non existing block', async () => {
      const text = `
      pipeline Test {
        pipe {
          from: CarsExtractor;
          to: CarsLoader;
        }
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error even if pipe references block of non existing type', async () => {
      const text = `
      pipeline Test {
        block UnknownOutput oftype UnknownOutputType {
        }

        block UnknownInput oftype UnknownInputType {
        }

        pipe {
          from: UnknownOutput;
          to: UnknownInput;
        }
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on unsupported pipe between Blocktypes', async () => {
      const text = `
      pipeline Test {
        block CarsExtractor oftype HttpExtractor {
          url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
        }

        block CarsLoader oftype SQLiteLoader {
          table: "Cars";
          file: "./cars.sqlite";
        }

        pipe {
          from: CarsExtractor;
          to: CarsLoader;
        }
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The output type "File" of HttpExtractor is incompatible with the input type "Table" of SQLiteLoader`,
        expect.any(Object),
      );
    });
  });

  describe('chained pipe', () => {
    // This test should succeed, because the error is thrown by langium during linking, not during validation!
    it('should have no error even if pipe references non existing block', async () => {
      const text = `
      pipeline Test {
        CarsExtractor -> CarsLoader;
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error even if pipe references block of non existing type', async () => {
      const text = `
      pipeline Test {
        block UnknownOutput oftype UnknownOutputType {
        }

        block UnknownInput oftype UnknownInputType {
        }
        
        UnknownOutput -> UnknownInput;
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on unsupported pipe between Blocktypes', async () => {
      const text = `
      pipeline Test {
        block CarsExtractor oftype HttpExtractor {
          url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
        }

        block CarsLoader oftype SQLiteLoader {
          table: "Cars";
          file: "./cars.sqlite";
        }
        
        CarsExtractor -> CarsLoader;
      }
      `;

      const parseResult = await parse(text);

      const pipe: PipeDefinition = extractPipe(parseResult);

      validatePipeDefinition(
        pipe,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The output type "File" of HttpExtractor is incompatible with the input type "Table" of SQLiteLoader`,
        expect.any(Object),
      );
    });
  });
});
