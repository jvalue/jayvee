// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { NodeFileSystem } from 'langium/node';

import { parseHelper } from '../../../test/langium-utils.js';
import { createJayveeServices } from '../../jayvee-module.js';
import { RuntimeParameterProvider } from '../../services/index.js';
import { TransformDefinition } from '../generated/ast.js';

import { EvaluationContext, evaluateExpression } from './evaluation.js';
import { InternalValueRepresentation } from './internal-value-representation.js';

export async function executeDefaultTextToTextExpression(
  expression: string,
  input: InternalValueRepresentation,
) {
  return executeExpressionTestHelper(
    expression,
    'inputValue',
    'text',
    input,
    'text',
  );
}

export async function executeExpressionTestHelper(
  expression: string,
  inputValueName: string,
  inputValueType: 'text',
  inputValueValue: InternalValueRepresentation,
  outputValueType: 'text',
): Promise<InternalValueRepresentation | undefined> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const parse = parseHelper(services);
  const locator = services.workspace.AstNodeLocator;

  const document = await parse(`
        transform TestTransform {
            from ${inputValueName} oftype ${inputValueType};
            to outputValue oftype ${outputValueType};
        
            outputValue: ${expression};
        }
    `);

  const transform = locator.getAstNode<TransformDefinition>(
    document.parseResult.value,
    'transforms@0',
  ) as TransformDefinition;

  const runTimeParameterProvider = new RuntimeParameterProvider();
  const evaluationContext = new EvaluationContext(runTimeParameterProvider);

  evaluationContext.setValueForReference(inputValueName, inputValueValue);

  return evaluateExpression(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transform.body.outputAssignments[0]!.expression,
    evaluationContext,
  );
}
