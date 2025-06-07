// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNodeWrapper,
  type ConstraintDefinition,
  type InternalValueRepresentation,
  type ValueTypeAttribute,
  type ValueTypeConstraintInlineDefinition,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export class ConstraintExecutor<
  T extends ConstraintDefinition | ValueTypeConstraintInlineDefinition,
> implements AstNodeWrapper<T>
{
  constructor(public readonly astNode: T) {}

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
    attribute: T extends ValueTypeConstraintInlineDefinition
      ? ValueTypeAttribute
      : void,
  ): boolean {
    const expression = this.astNode.expression;

    if (attribute === undefined) {
      context.evaluationContext.setValueForValueKeyword(value);
    } else {
      context.evaluationContext.setValueForReference(attribute.name, value);
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

    if (attribute === undefined) {
      context.evaluationContext.deleteValueForValueKeyword();
    } else {
      context.evaluationContext.deleteValueForReference(attribute.name);
    }

    return result;
  }
}
