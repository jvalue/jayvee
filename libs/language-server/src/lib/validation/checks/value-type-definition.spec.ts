// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type ValuetypeDefinition,
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

import { validateValueTypeDefinition } from './value-type-definition';

describe('Validation of ValuetypeDefinition', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateValuetypeDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const valueTypeDefinition = locator.getAstNode<ValuetypeDefinition>(
      document.parseResult.value,
      'valueTypes@0',
    ) as ValuetypeDefinition;

    validateValueTypeDefinition(
      valueTypeDefinition,
      createJayveeValidationProps(validationAcceptorMock, services),
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
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Could not construct this value type since there is a cycle in the (transitive) "oftype" relation.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on invalid constraints item', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-invalid-constraints-item.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type Collection<Constraint> but is of type Collection<boolean>`,
      expect.any(Object),
    );
  });

  it('should diagnose error on invalid constraint type for value type', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-invalid-constraint-type-for-value-type.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `This value type ValueType is not convertible to the type integer of the constraint "Constraint"`,
      expect.any(Object),
    );
  });

  it('should diagnose error on duplicate generic on value type', async () => {
    const text = readJvTestAsset(
      'value-type-definition/invalid-duplicate-generic.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Generic parameter T is not unique`,
      expect.any(Object),
    );
  });
});
