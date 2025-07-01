// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type ConstraintDefinition,
  type JayveeServices,
  createJayveeServices,
  isConstraintDefinition,
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

import { validateConstraintDefinition } from './constraint-definition';

describe('Validation of ConstraintDefinition', () => {
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

  async function parseAndValidateConstraintDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allConstraintDefinitions = extractTestElements(
      document,
      (x): x is ConstraintDefinition => isConstraintDefinition(x),
    );

    for (const constraint of allConstraintDefinitions) {
      validateConstraintDefinition(
        constraint,
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

  it('should have no error on valid constraint', async () => {
    const text = readJvTestAsset(
      'constraint-definition/valid-text-constraint.jv',
    );

    await parseAndValidateConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on incompatible type', async () => {
    const text = readJvTestAsset(
      'constraint-definition/invalid-incompatible-type.jv',
    );

    await parseAndValidateConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `The value needs to be of type boolean but is of type integer`,
      expect.any(Object),
    );
  });

  it('should diagnose info on simplifiable constraint', async () => {
    const text = readJvTestAsset(
      'constraint-definition/valid-simplify-info.jv',
    );

    await parseAndValidateConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'info',
      `The expression can be simplified to 8`,
      expect.any(Object),
    );
  });
});
