// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  LengthConstraintMetaInformation,
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

describe('Validation of LengthConstraint', () => {
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

    new LengthConstraintMetaInformation().validate(
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

  it('should diagnose error on min > max', async () => {
    const text = readJvTestAsset(
      'length-constraint-meta-inf/invalid-min-greater-max.jv',
    );

    await parseAndValidateConstraint(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The minimum length needs to be smaller or equal to the maximum length`,
      expect.any(Object),
    );
  });

  it('should diagnose error on min < 0', async () => {
    const text = readJvTestAsset(
      'length-constraint-meta-inf/invalid-min-negative.jv',
    );

    await parseAndValidateConstraint(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Bounds for length need to be equal or greater than zero`,
      expect.any(Object),
    );
  });

  it('should diagnose error on max < 0', async () => {
    const text = readJvTestAsset(
      'length-constraint-meta-inf/invalid-max-negative.jv',
    );

    await parseAndValidateConstraint(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Bounds for length need to be equal or greater than zero`,
      expect.any(Object),
    );
  });
});
