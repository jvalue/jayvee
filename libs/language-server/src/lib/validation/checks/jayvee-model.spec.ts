// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  JayveeModel,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateJayveeModel } from './jayvee-model';

describe('jayvee-model validation tests', () => {
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
      new ValidationContext(validationAcceptorMock),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('error on non unique pipelines', async () => {
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

  it('error on non unique transforms', async () => {
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

  it('error on non unique valuetypes', async () => {
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

  it('error on non unique constraints', async () => {
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
});
