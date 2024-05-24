// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockDefinition,
  type InternalValueRepresentation,
  type JayveeServices,
  createJayveeServices,
  initializeWorkspace,
  isTypedConstraintDefinition,
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
  AstUtils,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import { getTestExecutionContext } from '../../../../test/utils';

import { RangeConstraintExecutor } from './range-constraint-executor';

describe('Validation of RangeConstraintExecutor', () => {
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

    const allElements = AstUtils.streamAllContents(document.parseResult.value);
    const allConstraints = [...allElements.filter(isTypedConstraintDefinition)];
    expect(
      allConstraints.length > 0,
      'No constraint definition found in test file',
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const constraint = allConstraints[0]!;

    return new RangeConstraintExecutor().isValid(
      value,
      // Execution context with initial stack containing usage block of constraint and constraint itself
      getTestExecutionContext(locator, document, services, [
        usageBlock,
        constraint,
      ]),
    );
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    await initializeWorkspace(services);

    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'range-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 2);

    expect(valid).toBe(true);
  });

  it('should diagnose error on invalid value', async () => {
    const text = readJvTestAsset(
      'range-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 11);

    expect(valid).toBe(false);
  });

  it('should work with only an upper bound specified', async () => {
    const text = readJvTestAsset(
      'range-constraint-executor/only-upper-bound.jv',
    );

    const valid = await parseAndValidateConstraint(text, 0);

    expect(valid).toBe(true);
  });

  it('should work with only a lower bound specified', async () => {
    const text = readJvTestAsset(
      'range-constraint-executor/only-lower-bound.jv',
    );

    const valid = await parseAndValidateConstraint(text, 999999999);

    expect(valid).toBe(true);
  });
});
