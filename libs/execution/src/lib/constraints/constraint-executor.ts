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
  type ValueTypeProperty,
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
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
    context: ExecutionContext,
    properties: T extends ValueTypeConstraintInlineDefinition
      ? ValueTypeProperty[]
      : void,
  ): boolean {
    const expression = this.astNode.expression;

    if (properties === undefined) {
      context.evaluationContext.setValueForValueKeyword(value);
    } else {
      const assignment_for_type_system: ValueTypeProperty[] = properties;
      for (const property of assignment_for_type_system) {
        context.evaluationContext.setValueForReference(property.name, value);
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

    if (properties === undefined) {
      context.evaluationContext.deleteValueForValueKeyword();
    } else {
      const assignment_for_type_system: ValueTypeProperty[] = properties;
      for (const property of assignment_for_type_system) {
        context.evaluationContext.deleteValueForReference(property.name);
      }
    }

    return result;
  }
}
