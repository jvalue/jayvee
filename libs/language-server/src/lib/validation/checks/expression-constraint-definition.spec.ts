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
  type ExpressionConstraintDefinition,
  type JayveeServices,
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

import { validateExpressionConstraintDefinition } from './expression-constraint-definition';

describe('Validation of ConstraintDefinition (expression syntax)', () => {
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

  async function parseAndValidateExpressionConstraintDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const expressionConstraint =
      locator.getAstNode<ExpressionConstraintDefinition>(
        document.parseResult.value,
        'constraints@0',
      ) as ExpressionConstraintDefinition;

    validateExpressionConstraintDefinition(
      expressionConstraint,
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
