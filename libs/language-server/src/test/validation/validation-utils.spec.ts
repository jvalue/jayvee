// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PropertyAssignment,
  PropertyBody,
  ValidationContext,
  checkUniqueNames,
  createJayveeServices,
  getNodesWithNonUniqueNames,
  useExtension,
} from '../../lib';
import {
  ParseHelperOptions,
  extractPropertyBodyFromBlock,
  parseHelper,
  validationAcceptorMockImpl,
} from '../utils';

describe('validation-utils tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  describe('checkUniqueNames tests', () => {
    const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

    afterEach(() => {
      // Reset mock
      validationAcceptorMock.mockReset();
    });

    it('should have no error', async () => {
      const text = `
      pipeline Test {
        block CarsExtractor oftype HttpExtractor {
          url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
          uri: "test";
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);
      checkUniqueNames(
        propertyBody.properties,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on duplicate property names', async () => {
      const text = `
      pipeline Test {
        block CarsExtractor oftype HttpExtractor {
          url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
          url: "Duplicate";
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);
      checkUniqueNames(
        propertyBody.properties,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The propertyassignment name "url" needs to be unique.`,
        expect.any(Object),
      );
    });
  });

  describe('getNodesWithNonUniqueNames tests', () => {
    it('should return two duplicates', async () => {
      const text = `
      pipeline Test {
        block CarsExtractor oftype HttpExtractor {
          url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
          url: "Duplicate";
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);
      const nonUniqueNodes = getNodesWithNonUniqueNames(
        propertyBody.properties,
      );

      expect(nonUniqueNodes).toEqual(
        expect.arrayContaining<PropertyAssignment>([
          expect.objectContaining({ name: 'url' }) as PropertyAssignment,
          expect.objectContaining({ name: 'url' }) as PropertyAssignment,
        ]),
      );
      expect(nonUniqueNodes).toHaveLength(2);
    });

    it('should return empty array', async () => {
      const text = `
        pipeline Test {
          block CarsExtractor oftype HttpExtractor {
            url: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
            uri: "test";
          }
        }
        `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);
      const nonUniqueNodes = getNodesWithNonUniqueNames(
        propertyBody.properties,
      );

      expect(nonUniqueNodes).toHaveLength(0);
    });

    it('should return empty array on empty input', () => {
      const nonUniqueNodes = getNodesWithNonUniqueNames([]);

      expect(nonUniqueNodes).toHaveLength(0);
    });
  });
});
