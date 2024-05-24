// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, AstUtils, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  createJayveeServices,
  isExpressionConstraintDefinition,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateExpressionConstraintDefinition } from './expression-constraint-definition';

describe('Validation of ConstraintDefinition (expression syntax)', () => {
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

  async function parseAndValidateExpressionConstraintDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allElements = AstUtils.streamAllContents(document.parseResult.value);
    const allExpressionConstraintDefinitions = [
      ...allElements.filter(isExpressionConstraintDefinition),
    ];
    expect(
      allExpressionConstraintDefinitions.length > 0,
      'No expression constraint definition found in test file',
    );

    for (const expressionConstraint of allExpressionConstraintDefinitions) {
      validateExpressionConstraintDefinition(
        expressionConstraint,
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

  it('should have no error on valid expression constraint', async () => {
    const text = readJvTestAsset(
      'expression-constraint-definition/valid-text-constraint.jv',
    );

    await parseAndValidateExpressionConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on incompatible type', async () => {
    const text = readJvTestAsset(
      'expression-constraint-definition/invalid-incompatible-type.jv',
    );

    await parseAndValidateExpressionConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type boolean but is of type integer`,
      expect.any(Object),
    );
  });

  it('should diagnose info on simplifiable expression constraint', async () => {
    const text = readJvTestAsset(
      'expression-constraint-definition/valid-simplify-info.jv',
    );

    await parseAndValidateExpressionConstraintDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'info',
      `The expression can be simplified to 8`,
      expect.any(Object),
    );
  });
});
