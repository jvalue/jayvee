// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  type JayveeModel,
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

import { validateJayveeModel } from './jayvee-model';

describe('Validation of JayveeModel', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let services: JayveeServices;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateJayveeModel(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const jayveeModel = document.parseResult.value as JayveeModel;

    validateJayveeModel(
      jayveeModel,
      createJayveeValidationProps(validationAcceptorMock, services),
    );
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

  it('should diagnose error on non unique pipelines', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-pipelines.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The pipelinedefinition name "Pipeline" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique transforms', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-transforms.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The transformdefinition name "Transform" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique value types', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-value-types.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The valuetypedefinition name "ValueType" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique value types (naming collision with builtin)', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-duplicate-name-with-builtin-value-type.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The valuetypedefinition name "DuplicateValuetype" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique constraints', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-constraints.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The expressionconstraintdefinition name "Constraint" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique block types', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-block-types.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The builtinblocktypedefinition name "TestBlock" needs to be unique.`,
      expect.any(Object),
    );
  });
});
