// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AstNodeWrapper,
  ExpressionConstraintDefinition,
  InternalValueRepresentation,
  PrimitiveValuetypes,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context';
import { ConstraintExecutor } from '../constraint-executor';

export class ExpressionConstraintExecutor
  implements ConstraintExecutor, AstNodeWrapper<ExpressionConstraintDefinition>
{
  constructor(public readonly astNode: ExpressionConstraintDefinition) {}

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    const expression = this.astNode.expression;

    context.evaluationContext.setValueForValueKeyword(value);

    const result = evaluateExpression(expression, context.evaluationContext);
    assert(PrimitiveValuetypes.Boolean.isInternalValueRepresentation(result));

    context.evaluationContext.deleteValueForValueKeyword();

    return result;
  }
}
