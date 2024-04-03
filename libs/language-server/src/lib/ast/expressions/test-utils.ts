// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { NodeFileSystem } from 'langium/node';

import { parseHelper } from '../../../test/langium-utils';
import { createJayveeServices } from '../../jayvee-module';
import { RuntimeParameterProvider } from '../../services';
import { TransformDefinition } from '../generated/ast';
import { WrapperFactory } from '../wrappers';

import { evaluateExpression } from './evaluate-expression';
import { EvaluationContext } from './evaluation-context';
import { InternalValueRepresentation } from './internal-value-representation';
import { DefaultOperatorEvaluatorRegistry } from './operator-registry';

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
  const operatorEvaluatorRegistry = new DefaultOperatorEvaluatorRegistry();
  const evaluationContext = new EvaluationContext(
    runTimeParameterProvider,
    new DefaultOperatorEvaluatorRegistry(),
  );

  evaluationContext.setValueForReference(inputValueName, inputValueValue);

  return evaluateExpression(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transform.body.outputAssignments[0]!.expression,
    evaluationContext,
    new WrapperFactory(operatorEvaluatorRegistry),
  );
}
