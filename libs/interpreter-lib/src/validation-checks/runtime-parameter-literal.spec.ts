// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { parseValueToInternalRepresentation } from '@jvalue/jayvee-execution';
import {
  DefaultOperatorEvaluatorRegistry,
  DefaultOperatorTypeComputerRegistry,
  EvaluationContext,
  JayveeImportResolver,
  type JayveeServices,
  type RuntimeParameterLiteral,
  RuntimeParameterProvider,
  ValidationContext,
  ValueTypeProvider,
  WrapperFactoryProvider,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  expectNoParserAndLexerErrors,
  parseTestFileInWorkingDir,
  validationAcceptorMockImpl,
} from '@jvalue/jayvee-language-server/test';
import { type AstNodeLocator } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import { validateRuntimeParameterLiteral } from './runtime-parameter-literal';

describe('Validation of validateRuntimeParameterLiteral', () => {
  const WORKING_DIR = path.resolve(__dirname, '../../test/assets/');

  let services: JayveeServices;
  let locator: AstNodeLocator;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  async function parseAndValidateRuntimeParameterLiteral(
    relativeTestFilePath: string,
    runtimeParameters?: Map<string, string>,
  ) {
    const document = await parseTestFileInWorkingDir(
      WORKING_DIR,
      relativeTestFilePath,
      services,
    );
    expectNoParserAndLexerErrors(document);

    const runtimeParameter = locator.getAstNode<RuntimeParameterLiteral>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body/properties@0/value',
    ) as RuntimeParameterLiteral;

    const runtimeProvider = new RuntimeParameterProvider();
    runtimeProvider.setValueParser(parseValueToInternalRepresentation);
    if (runtimeParameters) {
      for (const [key, value] of runtimeParameters.entries()) {
        runtimeProvider.setValue(key, value);
      }
    }

    const valueTypeProvider = new ValueTypeProvider();
    const operatorEvaluatorRegistry = new DefaultOperatorEvaluatorRegistry(
      valueTypeProvider,
    );
    const wrapperFactories = new WrapperFactoryProvider(
      operatorEvaluatorRegistry,
      valueTypeProvider,
    );
    const operatorTypeComputerRegistry =
      new DefaultOperatorTypeComputerRegistry(
        valueTypeProvider,
        wrapperFactories,
      );

    const importResolver = new JayveeImportResolver(services);

    validateRuntimeParameterLiteral(runtimeParameter, {
      validationContext: new ValidationContext(
        validationAcceptorMock,
        operatorTypeComputerRegistry,
      ),
      evaluationContext: new EvaluationContext(
        runtimeProvider,
        operatorEvaluatorRegistry,
        valueTypeProvider,
      ),
      valueTypeProvider: valueTypeProvider,
      wrapperFactories: wrapperFactories,
      importResolver: importResolver,
    });
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should diagnose no error on valid runtime parameter value', async () => {
    const relativeTestFilePath =
      'runtime-parameter-literal/valid-text-runtime-property.jv';

    await parseAndValidateRuntimeParameterLiteral(
      relativeTestFilePath,
      new Map([['TEXT_ENV', 'Value 1']]),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on failed runtime parameter value parsing', async () => {
    const relativeTestFilePath =
      'runtime-parameter-literal/valid-integer-runtime-property.jv';

    await parseAndValidateRuntimeParameterLiteral(
      relativeTestFilePath,
      new Map([['INTEGER_ENV', 'Value 1']]), // wrong parameter type
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Unable to parse the value "Value 1" as integer.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing runtime parameter value', async () => {
    const relativeTestFilePath =
      'runtime-parameter-literal/valid-text-runtime-property.jv';

    await parseAndValidateRuntimeParameterLiteral(relativeTestFilePath); // don't pass parameter

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `A value needs to be provided by adding "-e TEXT_ENV=<value>" to the command.`,
      expect.any(Object),
    );
  });
});
