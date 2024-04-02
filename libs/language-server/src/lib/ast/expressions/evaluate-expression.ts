import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { type ValidationContext } from '../../validation';
import {
  Expression,
  PropertyAssignment,
  ValueLiteral,
  isBinaryExpression,
  isBlocktypeProperty,
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
// eslint-disable-next-line import/no-cycle
import { CellRangeWrapper, Valuetype } from '../wrappers';

import { type EvaluationContext } from './evaluation-context';
import { EvaluationStrategy } from './evaluation-strategy';
import { type InternalValueRepresentation } from './internal-value-representation';
import {
  binaryOperatorRegistry,
  ternaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';
import { isEveryValueDefined } from './typeguards';

export function evaluatePropertyValue<T extends InternalValueRepresentation>(
  property: PropertyAssignment,
  evaluationContext: EvaluationContext,
  valuetype: Valuetype<T>,
): T | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyValue = property?.value;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(propertyValue !== undefined);

  if (isBlocktypeProperty(propertyValue)) {
    // Properties of blocktypes are always undefined
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
        valuetype,
      );
    }
  } else if (isExpression(propertyValue)) {
    result = evaluateExpression(propertyValue, evaluationContext);
  } else {
    assertUnreachable(propertyValue);
  }

  assert(
    result === undefined || valuetype.isInternalValueRepresentation(result),
    `Evaluation result ${
      result?.toString() ?? 'undefined'
    } is not valid: Neither undefined, nor of type ${valuetype.getName()}`,
  );
  return result;
}

export function evaluateExpression(
  expression: Expression | undefined,
  evaluationContext: EvaluationContext,
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
        context,
        strategy,
      );
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
  if (isTernaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = ternaryOperatorRegistry[operator].evaluation;
    return evaluator.evaluate(expression, evaluationContext, strategy, context);
  }
  assertUnreachable(expression);
}

function evaluateValueLiteral(
  expression: ValueLiteral,
  evaluationContext: EvaluationContext,
  context: ValidationContext | undefined = undefined,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
): InternalValueRepresentation | undefined {
  if (isCollectionLiteral(expression)) {
    const evaluatedCollection = expression.values.map((v) =>
      evaluateExpression(v, evaluationContext, context, strategy),
    );
    if (!isEveryValueDefined(evaluatedCollection)) {
      return undefined;
    }
    return evaluatedCollection;
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
