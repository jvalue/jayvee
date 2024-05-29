// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import path from 'node:path';

import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  createJayveeServices,
  isJayveeModel,
} from '../../../lib';
import {
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseTestFileInWorkingDir,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateJayveeModel } from './jayvee-model';

describe('Validation of JayveeModel', () => {
  const WORKING_DIR = path.resolve(__dirname, '../../../test/assets/');
  let services: JayveeServices;
  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  async function parseAndValidateJayveeModel(relativeTestFilePath: string) {
    const document = await parseTestFileInWorkingDir(
      WORKING_DIR,
      relativeTestFilePath,
      services,
    );
    expectNoParserAndLexerErrors(document);

    const parsedModel = document.parseResult.value;
    assert(isJayveeModel(parsedModel), 'Test file is not valid Jayvee model');

    validateJayveeModel(
      parsedModel,
      createJayveeValidationProps(validationAcceptorMock, services),
    );
  }

  beforeEach(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should diagnose error on non-unique pipelines', async () => {
    const relativeTestFilePath = 'jayvee-model/invalid-non-unique-pipelines.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicatePipelineName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicatePipelineName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique transforms', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-transforms.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateTransformName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateTransformName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique value types', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-value-types.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateValueTypeName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateValueTypeName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique value types (naming collision with builtin)', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-duplicate-name-with-builtin-value-type.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateValueTypeName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateValueTypeName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique constraints', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-constraints.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateConstraintName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateConstraintName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique block types', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-block-types.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateBlockTypeName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateBlockTypeName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique name of different element types', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-different-element-types.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on non-unique name of different element types within a pipeline', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-name-within-pipeline-different-element-types.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose no error on name collision with builtin element', async () => {
    const relativeTestFilePath =
      'jayvee-model/valid-duplicate-name-with-builtin.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose no error on name collision between root-level and within-pipeline element', async () => {
    const relativeTestFilePath =
      'jayvee-model/valid-duplicate-name-with-pipeline-element.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on name collision with import', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-name-with-import.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateName" needs to be unique.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on name collision with import', async () => {
    const relativeTestFilePath =
      'jayvee-model/invalid-non-unique-name-with-import-alias.jv';

    await parseAndValidateJayveeModel(relativeTestFilePath);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `The name "DuplicateNameAliased" needs to be unique.`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `The name "DuplicateNameAliased" needs to be unique.`,
      expect.any(Object),
    );
  });
});
