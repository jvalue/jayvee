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
  type JayveeServices,
  type PropertyAssignment,
  type PropertyBody,
  type TypedObjectWrapper,
  createJayveeServices,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validatePropertyAssignment } from './property-assignment';

describe('Validation of PropertyAssignment', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidatePropertyAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const propertyBody = locator.getAstNode<PropertyBody>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body',
    ) as PropertyBody;

    const type = propertyBody.$container.type;

    const props = createJayveeValidationProps(validationAcceptorMock, services);
    const wrapper = props.wrapperFactories.TypedObject.wrap(type);
    expect(wrapper).toBeDefined();

    const propertyAssignment = locator.getAstNode<PropertyAssignment>(
      propertyBody,
      'properties@0',
    ) as PropertyAssignment;

    validatePropertyAssignment(
      propertyAssignment,
      wrapper as TypedObjectWrapper,
      props,
    );
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should diagnose error on invalid property name', async () => {
    const text = readJvTestAsset(
      'property-assignment/invalid-unknown-property.jv',
    );

    await parseAndValidatePropertyAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Invalid property name "unknownProperty".`,
      expect.any(Object),
    );
  });

  describe('Validation of RuntimeParameterLiteral assignment', () => {
    it('should have no error on runtime parameter for text property', async () => {
      const text = readJvTestAsset(
        'property-assignment/valid-runtime-property.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on runtime parameter for regex property', async () => {
      const text = readJvTestAsset(
        'property-assignment/invalid-runtime-property.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Runtime parameters are not allowed for properties of type Regex`,
        expect.any(Object),
      );
    });
  });

  it('should diagnose error on invalid property typing', async () => {
    const text = readJvTestAsset(
      'property-assignment/invalid-property-type.jv',
    );

    await parseAndValidatePropertyAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value of property "textProperty" needs to be of type text but is of type integer`,
      expect.any(Object),
    );
  });

  it('should diagnose info on simplifiable property expression', async () => {
    const text = readJvTestAsset('property-assignment/valid-simplify-info.jv');

    await parseAndValidatePropertyAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'info',
      `The expression can be simplified to 1019`,
      expect.any(Object),
    );
  });

  it('should diagnose info on simplifiable property sub-expression', async () => {
    const text = readJvTestAsset(
      'property-assignment/valid-simplify-info-sub-expression.jv',
    );

    await parseAndValidatePropertyAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'info',
      `The expression can be simplified to 30`,
      expect.any(Object),
    );
  });

  it('should diagnose info on non simplifiable property expression', async () => {
    const text = readJvTestAsset(
      'property-assignment/valid-uneccessarysimplify-info.jv',
    );

    await parseAndValidatePropertyAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
