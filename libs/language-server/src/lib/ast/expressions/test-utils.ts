// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { NodeFileSystem } from 'langium/node';

import { parseHelper } from '../../../test/langium-utils';
import { createJayveeServices } from '../../jayvee-module';
import { RuntimeParameterProvider } from '../../services';
import { TransformDefinition } from '../generated/ast';

import { EvaluationContext, evaluateExpression } from './evaluation';
import { InternalValueRepresentation } from './internal-value-representation';

export async function executeExpressionTestHelper(
  expression: string,
  inputValueName: string,
  inputValueValue: InternalValueRepresentation,
): Promise<InternalValueRepresentation | undefined> {
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const parse = parseHelper(services);
  const locator = services.workspace.AstNodeLocator;

  const document = await parse(`
        transform TestTransform {
            from ${inputValueName} oftype text;
            to outputValue oftype text;
        
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
