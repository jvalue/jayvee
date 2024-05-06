// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockDefinition,
  type InternalValueRepresentation,
  type JayveeServices,
  type TypedConstraintDefinition,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import { getTestExecutionContext } from '../../../../test/utils';

import { AllowlistConstraintExecutor } from './allowlist-constraint-executor';

describe('Validation of AllowlistConstraintExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidateConstraint(
    input: string,
    value: InternalValueRepresentation,
  ): Promise<boolean> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const usageBlock = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@2',
    ) as BlockDefinition;
    const constraint = locator.getAstNode<TypedConstraintDefinition>(
      document.parseResult.value,
      'constraints@0',
    ) as TypedConstraintDefinition;

    return new AllowlistConstraintExecutor().isValid(
      value,
      // Execution context with initial stack containing usage block of constraint and constraint itself
      getTestExecutionContext(locator, document, services, [
        usageBlock,
        constraint,
      ]),
    );
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'allowlist-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'ms');

    expect(valid).toBe(true);
  });

  it('should diagnose error on invalid value', async () => {
    const text = readJvTestAsset(
      'allowlist-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'ly');

    expect(valid).toBe(false);
  });
});
