// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PropertyAssignment,
  PropertyBody,
  ValidationContext,
  checkUniqueNames,
  createJayveeServices,
  getNodesWithNonUniqueNames,
  useExtension,
} from '..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAsset,
  validationAcceptorMockImpl,
} from '../../test';

describe('validation-utils tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  async function parseAndExtractPropertyBody(
    input: string,
  ): Promise<PropertyBody> {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    return locator.getAstNode<PropertyBody>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body',
    ) as PropertyBody;
  }

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
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
      const text = readJvTestAsset(
        'validation-utils/valid-distinct-property-names.jv',
      );

      const propertyBody: PropertyBody = await parseAndExtractPropertyBody(
        text,
      );
      checkUniqueNames(
        propertyBody.properties,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on duplicate property names', async () => {
      const text = readJvTestAsset(
        'validation-utils/invalid-duplicate-property-names.jv',
      );

      const propertyBody: PropertyBody = await parseAndExtractPropertyBody(
        text,
      );
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
      const text = readJvTestAsset(
        'validation-utils/invalid-duplicate-property-names.jv',
      );

      const propertyBody: PropertyBody = await parseAndExtractPropertyBody(
        text,
      );
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
      const text = readJvTestAsset(
        'validation-utils/valid-distinct-property-names.jv',
      );

      const propertyBody: PropertyBody = await parseAndExtractPropertyBody(
        text,
      );
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
