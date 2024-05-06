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
  type TypedConstraintDefinition,
  createJayveeServices,
  initializeWorkspace,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateTypedConstraintDefinition } from './typed-constraint-definition';

describe('Validation of ConstraintDefinition (typed syntax)', () => {
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

  async function parseAndValidateTypedConstraintDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const typedConstraint = locator.getAstNode<TypedConstraintDefinition>(
      document.parseResult.value,
      'constraints@0',
    ) as TypedConstraintDefinition;

    validateTypedConstraintDefinition(
      typedConstraint,
      createJayveeValidationProps(validationAcceptorMock, services),
    );
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    await initializeWorkspace(services);

    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error on valid typed constraint', async () => {
    const text = readJvTestAsset(
      'typed-constraint-definition/valid-typed-constraint.jv',
    );

    await parseAndValidateTypedConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on unknown constraint type', async () => {
    const text = readJvTestAsset(
      'typed-constraint-definition/invalid-unknown-constraint-type.jv',
    );

    await parseAndValidateTypedConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Unknown constraint type 'UnknownConstraint'`,
      expect.any(Object),
    );
  });
});
