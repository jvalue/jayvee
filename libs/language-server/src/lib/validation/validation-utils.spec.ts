// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  DefaultOperatorTypeComputerRegistry,
  type PropertyBody,
  ValidationContext,
  checkUniqueNames,
  createJayveeServices,
} from '..';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../test';

describe('Validation of validation-utils', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/',
  );

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
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  describe('Validation of checkUniqueNames', () => {
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
        new ValidationContext(
          validationAcceptorMock,
          new DefaultOperatorTypeComputerRegistry(),
        ),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on duplicate property names', async () => {
      const text = readJvTestAsset(
        'validation-utils/invalid-duplicate-property-names.jv',
      );

      const propertyBody: PropertyBody = await parseAndExtractPropertyBody(
        text,
      );
      checkUniqueNames(
        propertyBody.properties,
        new ValidationContext(
          validationAcceptorMock,
          new DefaultOperatorTypeComputerRegistry(),
        ),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        `The propertyassignment name "textProperty" needs to be unique.`,
        expect.any(Object),
      );
    });
  });
});
