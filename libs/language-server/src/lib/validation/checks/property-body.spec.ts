// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PropertyBody,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validatePropertyBody } from '../../../lib/validation/checks/property-body';
import {
  ParseHelperOptions,
  extractPropertyBodyFromBlock,
  parseHelper,
  readJvTestAsset,
  validationAcceptorMockImpl,
} from '../../../test';

describe('property-body validation tests', () => {
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

  it('error on missing properties', async () => {
    const text = readJvTestAsset('property-body/invalid-missing-property.jv');

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The following required properties are missing: "url"`,
      expect.any(Object),
    );
  });

  it('should have no error on missing properties with default values', async () => {
    const text = readJvTestAsset('property-body/valid-default-values.jv');

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('error on invalid property name', async () => {
    const text = readJvTestAsset('property-body/invalid-unknown-property.jv');

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Invalid property name "name".`,
      expect.any(Object),
    );
  });

  describe('runtime parameter for property', () => {
    it('should have no error on runtime parameter for text property', async () => {
      const text = readJvTestAsset('property-body/valid-runtime-property.jv');

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on runtime parameter for regex property', async () => {
      const text = readJvTestAsset('property-body/invalid-runtime-property.jv');

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Runtime parameters are not allowed for properties of type regex`,
        expect.any(Object),
      );
    });
  });

  it('error on invalid property typing', async () => {
    const text = readJvTestAsset('property-body/invalid-property-type.jv');

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type text but is of type integer`,
      expect.any(Object),
    );
  });

  it('info on simplifiable property expression', async () => {
    const text = readJvTestAsset('property-body/valid-simplify-info.jv');

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'info',
      `The expression can be simplified to 1019`,
      expect.any(Object),
    );
  });
});
