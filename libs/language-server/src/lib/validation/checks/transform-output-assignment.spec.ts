// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type TransformOutputAssignment,
  createJayveeServices,
  isTransformOutputAssignment,
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

import { validateTransformOutputAssignment } from './transform-output-assigment';

describe('Validation of TransformOutputAssignment', () => {
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

  async function parseAndValidateTransformOutputAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allOutputAssignments = extractTestElements(
      document,
      (x): x is TransformOutputAssignment => isTransformOutputAssignment(x),
    );

    for (const transformOutputAssignment of allOutputAssignments) {
      validateTransformOutputAssignment(
        transformOutputAssignment,
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

  it('should have no error on valid transform output assignment', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/valid-transform-output-assignment.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on invalid type', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/invalid-invalid-type.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `The value needs to be of type integer but is of type decimal`,
      expect.any(Object),
    );
  });

  it('should diagnose error on output port used in assignment', async () => {
    const text = readJvTestAsset(
      'transform-output-assignment/invalid-output-port-in-assignment.jv',
    );

    await parseAndValidateTransformOutputAssignment(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenLastCalledWith(
      'error',
      `Output ports are not allowed in this expression`,
      expect.any(Object),
    );
  });
});
