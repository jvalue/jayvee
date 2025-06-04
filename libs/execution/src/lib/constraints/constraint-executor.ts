// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNodeWrapper,
  type ConstraintDefinition,
  type InternalValueRepresentation,
  type ValueTypeConstraintInlineDefinition,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export class ConstraintExecutor
  implements
    AstNodeWrapper<ConstraintDefinition | ValueTypeConstraintInlineDefinition>
{
  constructor(astNode: ConstraintDefinition);
  constructor(
    astNode: ValueTypeConstraintInlineDefinition,
    attributeName: string,
  );
  constructor(
    public readonly astNode:
      | ConstraintDefinition
      | ValueTypeConstraintInlineDefinition,
    public readonly attributeName?: string,
  ) {}

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    const expression = this.astNode.expression;

    if (this.attributeName === undefined) {
      context.evaluationContext.setValueForValueKeyword(value);
    } else {
      context.evaluationContext.setValueForReference(this.attributeName, value);
    }

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

    if (this.attributeName === undefined) {
      context.evaluationContext.deleteValueForValueKeyword();
    } else {
      context.evaluationContext.deleteValueForReference(this.attributeName);
    }

    return result;
  }
}
