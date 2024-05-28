// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type PropertyBody,
  createJayveeServices,
  isBlockDefinition,
  isPropertyBody,
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

import { validatePropertyBody } from './property-body';

describe('Validation PropertyBody', () => {
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

  async function parseAndValidatePropertyBody(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allPropertyBodies = extractTestElements(
      document,
      (x): x is PropertyBody =>
        isPropertyBody(x) && isBlockDefinition(x.$container),
    );

    for (const propertyBody of allPropertyBodies) {
      validatePropertyBody(
        propertyBody,
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

  it('should diagnose error on missing properties', async () => {
    const text = readJvTestAsset('property-body/invalid-missing-property.jv');

    await parseAndValidatePropertyBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The following required properties are missing: "textProperty"`,
      expect.any(Object),
    );
  });

  it('should have no error on missing properties with default values', async () => {
    const text = readJvTestAsset('property-body/valid-default-values.jv');

    await parseAndValidatePropertyBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on failed property validation', async () => {
    const text = readJvTestAsset(
      'property-body/invalid-property-validation-failed.jv',
    );

    await parseAndValidatePropertyBody(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      'The value of property "customValidationTextProperty" needs to be of type CustomValuetype but is of type text',
      expect.any(Object),
    );
  });
});
