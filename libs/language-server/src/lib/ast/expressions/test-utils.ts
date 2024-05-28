// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstUtils } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { expect } from 'vitest';

import { parseHelper } from '../../../test/langium-utils';
import { createJayveeServices } from '../../jayvee-module';
import { isTransformDefinition } from '../generated/ast';

import { evaluateExpression } from './evaluate-expression';
import { EvaluationContext } from './evaluation-context';
import { type InternalValueRepresentation } from './internal-value-representation';

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

  const document = await parse(`
        transform TestTransform {
            from ${inputValueName} oftype ${inputValueType};
            to outputValue oftype ${outputValueType};
        
            outputValue: ${expression};
        }
    `);

  const allElements = AstUtils.streamAllContents(document.parseResult.value);
  const allTransforms = [...allElements.filter(isTransformDefinition)];
  expect(allTransforms.length).toBe(1);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const transform = allTransforms[0]!;

  const evaluationContext = new EvaluationContext(
    services.RuntimeParameterProvider,
    services.operators.EvaluatorRegistry,
    services.ValueTypeProvider,
  );

  evaluationContext.setValueForReference(inputValueName, inputValueValue);

  return evaluateExpression(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transform.body.outputAssignments[0]!.expression,
    evaluationContext,
    services.WrapperFactories,
  );
}
