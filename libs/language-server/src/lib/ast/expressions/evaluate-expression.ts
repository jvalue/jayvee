// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
import { type InternalValueRepresentation } from './internal-value-representation';
import { isEveryValueDefined } from './typeguards';

export function evaluatePropertyValue<T extends InternalValueRepresentation>(
  property: PropertyAssignment,
  evaluationContext: EvaluationContext,
  wrapperFactories: WrapperFactoryProvider,
  valueType: ValueType<T>,
): T | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyValue = property?.value;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(propertyValue !== undefined);

  if (isBlockTypeProperty(propertyValue)) {
    // Properties of block types are always undefined
    // because they are set in the block that instantiates the block type
    return undefined;
  }

  let result: InternalValueRepresentation | undefined;
  if (isRuntimeParameterLiteral(propertyValue)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const runtimeParameterName = propertyValue?.name;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (runtimeParameterName === undefined) {
      result = undefined;
    } else {
      result = evaluationContext.getValueForRuntimeParameter(
        runtimeParameterName,
        valueType,
      );
    }
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
    result === undefined || valueType.isInternalValueRepresentation(result),
    `Evaluation result ${
      result?.toString() ?? 'undefined'
    } is not valid: Neither undefined, nor of type ${valueType.getName()}`,
  );
  return result;
}

export function evaluateExpression(
  expression: Expression | undefined,
  evaluationContext: EvaluationContext,
  wrapperFactories: WrapperFactoryProvider,
  context: ValidationContext | undefined = undefined,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
): InternalValueRepresentation | undefined {
  if (expression === undefined) {
    return undefined;
  }
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
): InternalValueRepresentation | undefined {
  if (isCollectionLiteral(expression)) {
    const evaluatedCollection = expression.values.map((v) =>
      evaluateExpression(
        v,
        evaluationContext,
        wrapperFactories,
        validationContext,
        strategy,
      ),
    );
    if (!isEveryValueDefined(evaluatedCollection)) {
      return undefined;
    }
    return evaluatedCollection;
  }
  if (isCellRangeLiteral(expression)) {
    if (!wrapperFactories.CellRange.canWrap(expression)) {
      return undefined;
    }
    return expression;
  }
  if (isRegexLiteral(expression)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (expression?.value === undefined) {
      return undefined;
    }
    return new RegExp(expression.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return expression?.value;
}
