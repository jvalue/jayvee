// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable, isReference } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  CollectionLiteral,
  ConstraintDefinition,
  Expression,
  RuntimeParameterLiteral,
  TransformerPortDefinition,
  ValueLiteral,
  ValuetypeAssignment,
  VariableLiteral,
  isBinaryExpression,
  isCellRangeLiteral,
  isCollectionLiteral,
  isExpression,
  isExpressionLiteral,
  isRegexLiteral,
  isRuntimeParameterLiteral,
  isUnaryExpression,
  isValueLiteral,
  isVariableLiteral,
} from '../generated/ast';
import { CellRangeWrapper } from '../wrappers/cell-range-wrapper';
import { type Valuetype } from '../wrappers/value-type';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type OperandValue =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeWrapper
  | ConstraintDefinition
  | ValuetypeAssignment
  | CollectionLiteral
  | TransformerPortDefinition;
export class EvaluationContext {
  constructor(
    public runtimeParameterValues: Map<string, OperandValue> = new Map(),
    public variableValues: Map<string, OperandValue> = new Map(),
  ) {}

  getValueFor(literal: VariableLiteral | RuntimeParameterLiteral) {
    if (isVariableLiteral(literal)) {
      return this.getValueForVariable(literal);
    } else if (isRuntimeParameterLiteral(literal)) {
      return this.getValueForRuntimeParameter(literal);
    }
    assertUnreachable(literal);
  }

  getValueForVariable(
    variableLiteral: VariableLiteral,
  ): OperandValue | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const key = variableLiteral?.value?.$refText;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (key === undefined) {
      return undefined;
    }

    return this.variableValues.get(key);
  }

  getValueForRuntimeParameter(
    parameterLiteral: RuntimeParameterLiteral,
  ): OperandValue | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const key = parameterLiteral?.name;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (key === undefined) {
      return undefined;
    }

    return this.runtimeParameterValues.get(key);
  }
}

export type OperandValueTypeguard<T extends OperandValue> = (
  value: OperandValue,
) => value is T;

export function evaluatePropertyValueExpression<T extends OperandValue>(
  propertyValue: Valuetype | RuntimeParameterLiteral,
  evaluationContext: EvaluationContext,
  typeguard: OperandValueTypeguard<T>,
): T {
  assert(isExpression(propertyValue));
  const resultingValue = evaluateExpression(propertyValue, evaluationContext);
  assert(resultingValue !== undefined);
  assert(typeguard(resultingValue));
  return resultingValue;
}

export function evaluateExpression(
  expression: Expression,
  evaluationContext: EvaluationContext,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
  context: ValidationContext | undefined = undefined,
): OperandValue | undefined {
  if (isExpressionLiteral(expression)) {
    if (isVariableLiteral(expression)) {
      return evaluationContext.getValueFor(expression);
    } else if (isValueLiteral(expression)) {
      return evaluateValueLiteral(expression);
    }
    assertUnreachable(expression);
  }
  if (isUnaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = unaryOperatorRegistry[operator].evaluation;
    return evaluator.evaluate(expression, evaluationContext, strategy, context);
  }
  if (isBinaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = binaryOperatorRegistry[operator].evaluation;
    return evaluator.evaluate(expression, evaluationContext, strategy, context);
  }
  assertUnreachable(expression);
}

function evaluateValueLiteral(
  expression: ValueLiteral,
): OperandValue | undefined {
  if (isCollectionLiteral(expression)) {
    return expression;
  }
  if (isCellRangeLiteral(expression)) {
    if (!CellRangeWrapper.canBeWrapped(expression)) {
      return undefined;
    }
    return new CellRangeWrapper(expression);
  }
  if (isRegexLiteral(expression)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (expression?.value === undefined) {
      return undefined;
    }
    return new RegExp(expression.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isReference(expression?.value)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return expression?.value?.ref;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return expression?.value;
}
