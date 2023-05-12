// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  CollectionLiteral,
  ConstraintDefinition,
  Expression,
  ReferenceLiteral,
  RuntimeParameterLiteral,
  TransformDefinition,
  TransformPortDefinition,
  ValueLiteral,
  ValuetypeAssignment,
  isBinaryExpression,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintDefinition,
  isExpression,
  isExpressionLiteral,
  isReferenceLiteral,
  isRegexLiteral,
  isRuntimeParameterLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isUnaryExpression,
  isValueLiteral,
} from '../generated/ast';
import { CellRangeWrapper } from '../wrappers/cell-range-wrapper';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type InternalValueRepresentation =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeWrapper
  | ConstraintDefinition
  | ValuetypeAssignment
  | CollectionLiteral
  | TransformDefinition
  | TransformPortDefinition;
export class EvaluationContext {
  constructor(
    public runtimeParameterValues: Map<
      string,
      InternalValueRepresentation
    > = new Map(),
    public variableValues: Map<string, InternalValueRepresentation> = new Map(),
  ) {}

  getValueFor(
    literal: ReferenceLiteral | RuntimeParameterLiteral,
  ): InternalValueRepresentation | undefined {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isRuntimeParameterLiteral(literal)) {
      return this.getValueForRuntimeParameter(literal);
    }
    assertUnreachable(literal);
  }

  setValueForReference(
    refText: string,
    value: InternalValueRepresentation,
  ): void {
    this.variableValues.set(refText, value);
  }

  deleteValueForReference(refText: string): void {
    this.variableValues.delete(refText);
  }

  getValueForReference(
    referenceLiteral: ReferenceLiteral,
  ): InternalValueRepresentation | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const dereferenced = referenceLiteral?.value?.ref;
    if (dereferenced === undefined) {
      return undefined;
    }

    if (isConstraintDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformPortDefinition(dereferenced)) {
      return this.variableValues.get(dereferenced.name);
    }
    assertUnreachable(dereferenced);
  }

  getValueForRuntimeParameter(
    parameterLiteral: RuntimeParameterLiteral,
  ): InternalValueRepresentation | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const key = parameterLiteral?.name;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (key === undefined) {
      return undefined;
    }

    return this.runtimeParameterValues.get(key);
  }
}

export type OperandValueTypeguard<T extends InternalValueRepresentation> = (
  value: InternalValueRepresentation,
) => value is T;

export function evaluatePropertyValueExpression<
  T extends InternalValueRepresentation,
>(
  propertyValue: Expression | RuntimeParameterLiteral,
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
): InternalValueRepresentation | undefined {
  if (isExpressionLiteral(expression)) {
    if (isReferenceLiteral(expression)) {
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
): InternalValueRepresentation | undefined {
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
  return expression?.value;
}
