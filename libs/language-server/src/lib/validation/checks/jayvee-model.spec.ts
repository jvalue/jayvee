// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { JayveeModel, createJayveeServices } from '../../../lib';
import {
  ParseHelperOptions,
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
      createJayveeValidationProps(validationAcceptorMock),
    );
  }

  beforeAll(() => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
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

  it('should diagnose error on non unique valuetypes', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-valuetypes.jv',
    );

    await parseAndValidateJayveeModel(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The valuetypedefinition name "ValueType" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non unique valuetypes (naming collision with builtin)', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-duplicate-name-with-builtin-valuetype.jv',
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

  it('should diagnose error on non unique blocktypes', async () => {
    const text = readJvTestAsset(
      'jayvee-model/invalid-non-unique-blocktypes.jv',
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
