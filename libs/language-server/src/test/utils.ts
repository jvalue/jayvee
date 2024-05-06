// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  type AstNode,
  type LangiumDocument,
  type ValidationAcceptor,
} from 'langium';
import { type WorkspaceFolder } from 'vscode-languageserver-protocol';

import {
  EvaluationContext,
  type JayveeServices,
  type JayveeValidationProps,
  ValidationContext,
} from '../lib';
import { initializeWorkspace } from '../lib/builtin-library/jayvee-workspace-manager';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const validationAcceptorMockImpl: ValidationAcceptor = () => {};

/**
 * Returns function for reading a jv test asset file from the specified asset root
 * @param assetPath paths to the asset root directory
 * @returns function for reading jv asset file
 */
export function readJvTestAssetHelper(
  ...assetPath: string[]
): (testFileName: string) => string {
  /**
   * Reads the jv test asset file with the given filename from the previously configured asset directory
   * @param testFileName asset filename containing jv code
   * @returns content of asset file
   */
  return (testFileName: string) => {
    const text = readFileSync(
      path.resolve(...assetPath, testFileName),
      'utf-8',
    );
    // Expect the test asset to contain something
    expect(text).not.toBe('');
    return text;
  };
}

export function expectNoParserAndLexerErrors(
  document: LangiumDocument<AstNode>,
) {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);
}

export async function loadTestExtensions(
  services: JayveeServices,
  testExtensionJvFiles: string[],
) {
  assert(testExtensionJvFiles.every((file) => file.endsWith('.jv')));
  const extensions: WorkspaceFolder[] = testExtensionJvFiles.map((file) => ({
    uri: path.dirname(file),
    name: path.basename(file),
  }));
  return initializeWorkspace(services, extensions);
}

export function createJayveeValidationProps(
  validationAcceptor: ValidationAcceptor,
  services: JayveeServices,
): JayveeValidationProps {
  const valueTypeProvider = services.ValueTypeProvider;
  const operatorEvaluatorRegistry = services.operators.EvaluatorRegistry;
  const wrapperFactories = services.WrapperFactories;
  const operatorTypeComputerRegistry = services.operators.TypeComputerRegistry;
  const runtimeParameterProvider = services.RuntimeParameterProvider;

  return {
    validationContext: new ValidationContext(
      validationAcceptor,
      operatorTypeComputerRegistry,
    ),
    evaluationContext: new EvaluationContext(
      runtimeParameterProvider,
      operatorEvaluatorRegistry,
      valueTypeProvider,
    ),
    valueTypeProvider: valueTypeProvider,
    wrapperFactories: wrapperFactories,
  };
}
