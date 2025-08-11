// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { type ValidationContext } from '../../validation';
import {
  type Expression,
  type PropertyAssignment,
  type ValueLiteral,
  isBinaryExpression,
  isBlockTypeProperty,
  isCellRangeLiteral,
  isCollectionLiteral,
  isErrorLiteral,
  isExpression,
  isExpressionLiteral,
  isFreeVariableLiteral,
  isRegexLiteral,
  isRuntimeParameterLiteral,
  isTernaryExpression,
  isUnaryExpression,
  isValueLiteral,
} from '../generated/ast';
import { type ValueType, type WrapperFactoryProvider } from '../wrappers';

import { type EvaluationContext } from './evaluation-context';
import { EvaluationStrategy } from './evaluation-strategy';
import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  InvalidValue,
  MissingValue,
  internalValueToString,
} from './internal-value-representation';
import { ERROR_TYPEGUARD } from './typeguards';

export function evaluatePropertyValue<
  T extends InternalValidValueRepresentation,
>(
  property: PropertyAssignment,
  evaluationContext: EvaluationContext,
  wrapperFactories: WrapperFactoryProvider,
  valueType: ValueType<T>,
): T | InternalErrorValueRepresentation {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyValue = property?.value;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(propertyValue !== undefined);

  // Properties of block types are always undefined
  // because they are set in the block that instantiates the block type
  assert(!isBlockTypeProperty(propertyValue));

  let result:
    | InternalValidValueRepresentation
    | InternalErrorValueRepresentation;
  if (isRuntimeParameterLiteral(propertyValue)) {
    const runtimeParameterName = propertyValue.name;
    result = evaluationContext.getValueForRuntimeParameter(
      runtimeParameterName,
      valueType,
    );
  } else if (isExpression(propertyValue)) {
    result = evaluateExpression(
      propertyValue,
      evaluationContext,
      wrapperFactories,
    );
  } else {
    assertUnreachable(propertyValue);
  }

  assert(
    ERROR_TYPEGUARD(result) ||
      valueType.isInternalValidValueRepresentation(result),
    `Evaluation result ${
      ERROR_TYPEGUARD(result)
        ? result.name
        : internalValueToString(result, wrapperFactories)
    } is not of type ${valueType.getName()}`,
  );
  return result;
}

export function evaluateExpression(
  expression: Expression,
  evaluationContext: EvaluationContext,
  wrapperFactories: WrapperFactoryProvider,
  context: ValidationContext | undefined = undefined,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
): InternalValidValueRepresentation | InternalErrorValueRepresentation {
  if (isExpressionLiteral(expression)) {
    if (isFreeVariableLiteral(expression)) {
      return evaluationContext.getValueFor(expression);
    } else if (isValueLiteral(expression)) {
      return evaluateValueLiteral(
        expression,
        evaluationContext,
        wrapperFactories,
        context,
        strategy,
      );
    }
    assertUnreachable(expression);
  }
  if (isUnaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = evaluationContext.operatorRegistry.unary[operator];
    return evaluator.evaluate(
      expression,
      evaluationContext,
      wrapperFactories,
      strategy,
      context,
    );
  }
  if (isBinaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = evaluationContext.operatorRegistry.binary[operator];
    return evaluator.evaluate(
      expression,
      evaluationContext,
      wrapperFactories,
      strategy,
      context,
    );
  }
  if (isTernaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = evaluationContext.operatorRegistry.ternary[operator];
    return evaluator.evaluate(
      expression,
      evaluationContext,
      wrapperFactories,
      strategy,
      context,
    );
  }
  assertUnreachable(expression);
}

function evaluateValueLiteral(
  expression: ValueLiteral,
  evaluationContext: EvaluationContext,
  wrapperFactories: WrapperFactoryProvider,
  validationContext: ValidationContext | undefined = undefined,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
): InternalValidValueRepresentation | InternalErrorValueRepresentation {
  if (isErrorLiteral(expression)) {
    return expression.error === 'invalid'
      ? new InvalidValue('Created by user')
      : new MissingValue('Created by user');
  }
  if (isCollectionLiteral(expression)) {
    const evaluatedCollection: InternalValidValueRepresentation[] = [];
    for (const value of expression.values) {
      const result = evaluateExpression(
        value,
        evaluationContext,
        wrapperFactories,
        validationContext,
        strategy,
      );
      if (ERROR_TYPEGUARD(result)) {
        return result;
      }
      evaluatedCollection.push(result);
    }
    return evaluatedCollection;
  }
  if (isCellRangeLiteral(expression)) {
    if (!wrapperFactories.CellRange.canWrap(expression)) {
      return new InvalidValue(
        `${internalValueToString(
          expression,
          wrapperFactories,
        )} is not a valid cell range`,
      );
    }
    return expression;
  }
  if (isRegexLiteral(expression)) {
    return new RegExp(expression.value);
  }
  return expression.value;
}
