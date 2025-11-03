// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type ValuetypeDefinition,
  createJayveeServices,
  isValuetypeDefinition,
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

import { validateValueTypeDefinition } from './value-type-definition';

describe('Validation of ValuetypeDefinition', () => {
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

  async function parseAndValidateValuetypeDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allValueTypes = extractTestElements(
      document,
      (x): x is ValuetypeDefinition => isValuetypeDefinition(x),
    );

    for (const valueTypeDefinition of allValueTypes) {
      validateValueTypeDefinition(
        valueTypeDefinition,
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

  it('should have no error on empty constraint list', async () => {
    const text = readJvTestAsset(
      'value-type-definition/valid-value-type-definition.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on supertype cycle', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-supertype-cycle.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `Could not construct this value type since there is a cycle in the (transitive) "oftype" relation.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on invalid constraint type for value type', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-invalid-constraint-type-for-value-type.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `'Constraint' cannot constrain 'attr', because 'integer' is incompatible with 'text'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on duplicate generic on value type', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-duplicate-generic.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `Generic parameter T is not unique`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing value type property in inline constraint definition', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-invalid-constraint-type-for-value-type.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `'Constraint' cannot constrain 'attr', because 'integer' is incompatible with 'text'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing property in inline constraint', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-missing-property-in-inline-constraint.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `An inline constraint expression must contain a reference to one of the valuetype's properties`,
      expect.any(Object),
    );
  });

  it('should have no error on accessing nested properties in inline constraint', async () => {
    const text = readJvTestAsset(
      'value-type-definition/valid-constraint-access-nested-property.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on accessing non-existing nested property in inline constraint', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-constraint-access-nested-property.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      'Could not access nested property `nonExistent`',
      expect.any(Object),
    );
  });
});
