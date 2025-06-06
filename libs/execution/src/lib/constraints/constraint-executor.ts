// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNodeWrapper,
  type ConstraintDefinition,
  type InternalValueRepresentation,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export class ConstraintExecutor
  implements AstNodeWrapper<ConstraintDefinition>
{
  constructor(public readonly astNode: ConstraintDefinition) {}

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    const expression = this.astNode.expression;

    context.evaluationContext.setValueForValueKeyword(value);

    const result = evaluateExpression(
      expression,
      context.evaluationContext,
      context.wrapperFactories,
    );
    assert(
      context.valueTypeProvider.Primitives.Boolean.isInternalValueRepresentation(
        result,
      ),
    );

    context.evaluationContext.deleteValueForValueKeyword();

    return result;
  }
}
