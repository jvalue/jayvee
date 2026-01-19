// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNodeWrapper,
  type ConstraintDefinition,
  ERROR_TYPEGUARD,
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  type ValueTypeConstraintInlineDefinition,
  evaluateExpression,
  isConstraintDefinition,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export class ConstraintExecutor
  implements
    AstNodeWrapper<ConstraintDefinition | ValueTypeConstraintInlineDefinition>
{
  constructor(
    public readonly astNode:
      | ConstraintDefinition
      | ValueTypeConstraintInlineDefinition,
  ) {}

  get name(): string {
    return this.astNode.name;
  }

  isValid(
    values: Map<
      string,
      InternalValidValueRepresentation | InternalErrorValueRepresentation
    >,
    context: ExecutionContext,
  ): boolean {
    const expression = this.astNode.expression;

    if (isConstraintDefinition(this.astNode)) {
      const value = values.get('value');
      assert(value !== undefined);
      context.evaluationContext.setValueForValueKeyword(value);
    } else {
      for (const [name, value] of values) {
        context.evaluationContext.setValueForReference(name, value);
      }
    }

    const result = evaluateExpression(
      expression,
      context.evaluationContext,
      context.wrapperFactories,
    );
    if (ERROR_TYPEGUARD(result)) {
      context.logger.logErr(result.toString());
      return false;
    }
    assert(
      context.valueTypeProvider.Primitives.Boolean.isInternalValidValueRepresentation(
        result,
      ),
    );

    return result;
  }
}
