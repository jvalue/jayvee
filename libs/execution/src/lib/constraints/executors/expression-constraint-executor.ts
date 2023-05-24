// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AstNodeWrapper,
  ExpressionConstraintDefinition,
  PrimitiveValuetypes,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { ExecutionContext } from '../../execution-context';
import { ConstraintExecutor } from '../constraint-executor';

export class ExpressionConstraintExecutor
  implements ConstraintExecutor, AstNodeWrapper<ExpressionConstraintDefinition>
{
  constructor(public readonly astNode: ExpressionConstraintDefinition) {}

  isValid(value: unknown, context: ExecutionContext): boolean {
    const expression = this.astNode.expression;

    const result = evaluateExpression(expression, context.evaluationContext);
    assert(PrimitiveValuetypes.Boolean.isInternalValueRepresentation(result));

    return result;
  }
}
