// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  RangeConstraintMetaInformation,
  RuntimeParameterProvider,
  TypedConstraintDefinition,
  ValidationContext,
  createJayveeServices,
} from '../..';
import { ParseHelperOptions, parseHelper } from '../../test/langium-utils';
import {
  expectNoParserAndLexerErrors,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../test/utils';

describe('Validation of RangeConstraint', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/',
  );

  async function parseAndValidateConstraint(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const constraint = locator.getAstNode<TypedConstraintDefinition>(
      document.parseResult.value,
      'constraints@0',
    ) as TypedConstraintDefinition;

    new RangeConstraintMetaInformation().validate(
      constraint.body,
      new ValidationContext(validationAcceptorMock),
      new EvaluationContext(new RuntimeParameterProvider()),
    );
  }

  beforeAll(() => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should diagnose error on lower bound > upper bound', async () => {
    const text = readJvTestAsset(
      'range-constraint-meta-inf/invalid-lower-above-upper.jv',
    );

    await parseAndValidateConstraint(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The lower bound needs to be smaller or equal to the upper bound`,
      expect.any(Object),
    );
  });

  it('should diagnose error on lower bound = upper bound without bound inclusivity = true', async () => {
    const text = readJvTestAsset(
      'range-constraint-meta-inf/invalid-missing-bound-inclusivity.jv',
    );

    await parseAndValidateConstraint(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Lower and upper bounds need to be inclusive if they are identical`,
      expect.any(Object),
    );
  });
});
