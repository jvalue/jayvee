// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type PropertyBody,
  type PropertySpecification,
  type TypedObjectWrapper,
  createJayveeServices,
  isPropertyBody,
  isTypedConstraintDefinition,
} from '../../..';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../../test';

import { checkConstraintTypeSpecificProperties } from './property-assignment';

describe('Validation of constraint type specific properties', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidatePropertyAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const propertyBody = extractTestElements(
      document,
      (x): x is PropertyBody =>
        isPropertyBody(x) && isTypedConstraintDefinition(x.$container),
    )[0]!;

    const props = createJayveeValidationProps(validationAcceptorMock, services);

    const wrapper = props.wrapperFactories.TypedObject.wrap(
      propertyBody.$container.type,
    );
    expect(wrapper).toBeDefined();

    propertyBody.properties.forEach((propertyAssignment) => {
      const propertySpec = (
        wrapper as TypedObjectWrapper
      ).getPropertySpecification(propertyAssignment.name);
      expect(propertySpec).toBeDefined();

      checkConstraintTypeSpecificProperties(
        propertyAssignment,
        propertySpec as PropertySpecification,
        props,
      );
    });
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

  describe('LengthConstraint constraint type', () => {
    it('should diagnose error on min < 0', async () => {
      const text = readJvTestAsset(
        'property-assignment/constrainttype-specific/length-constraint/invalid-min-negative.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Bounds for "minLength" need to be equal or greater than zero`,
        expect.any(Object),
      );
    });

    it('should diagnose error on max < 0', async () => {
      const text = readJvTestAsset(
        'property-assignment/constrainttype-specific/length-constraint/invalid-max-negative.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Bounds for "maxLength" need to be equal or greater than zero`,
        expect.any(Object),
      );
    });
  });
});
