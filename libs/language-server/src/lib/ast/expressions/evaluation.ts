// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { RuntimeParameterProvider } from '../../services';
import { ValidationContext } from '../../validation/validation-context';
import {
  ConstraintDefinition,
  Expression,
  FreeVariableLiteral,
  ReferenceLiteral,
  RuntimeParameterLiteral,
  TransformDefinition,
  ValueKeywordLiteral,
  ValueLiteral,
  ValuetypeAssignment,
  isBinaryExpression,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintDefinition,
  isExpression,
  isExpressionLiteral,
  isFreeVariableLiteral,
  isReferenceLiteral,
  isRegexLiteral,
  isRuntimeParameterLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isUnaryExpression,
  isValueKeywordLiteral,
  isValueLiteral,
} from '../generated/ast';
import { CellRangeWrapper } from '../wrappers/cell-range-wrapper';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../wrappers/value-type/primitive/primitive-valuetypes';
import { Valuetype } from '../wrappers/value-type/valuetype';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';
import { isEveryValueDefined } from './typeguards';

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type InternalValueRepresentation =
  | AtomicInternalValueRepresentation
  | Array<InternalValueRepresentation>
  | [];

export type AtomicInternalValueRepresentation =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeWrapper
  | ConstraintDefinition
  | ValuetypeAssignment
  | TransformDefinition;

export class EvaluationContext {
  private readonly variableValues = new Map<
    string,
    InternalValueRepresentation
  >();
  private valueKeywordValue: InternalValueRepresentation | undefined =
    undefined;

  constructor(
    public readonly runtimeParameterProvider: RuntimeParameterProvider,
  ) {}

  getValueFor(
    literal: FreeVariableLiteral,
  ): InternalValueRepresentation | undefined {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isValueKeywordLiteral(literal)) {
      return this.getValueForValueKeyword(literal);
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

  hasValueForRuntimeParameter(key: string): boolean {
    return this.runtimeParameterProvider.hasValue(key);
  }

  getValueForRuntimeParameter<I extends InternalValueRepresentation>(
    key: string,
    valuetype: Valuetype<I>,
  ): I | undefined {
    return this.runtimeParameterProvider.getParsedValue(key, valuetype);
  }

  setValueForValueKeyword(value: InternalValueRepresentation) {
    this.valueKeywordValue = value;
  }

  deleteValueForValueKeyword() {
    this.valueKeywordValue = undefined;
  }

  getValueForValueKeyword(
    literal: ValueKeywordLiteral,
  ): InternalValueRepresentation | undefined {
    if (this.valueKeywordValue === undefined) {
      return undefined;
    }

    if (literal.lengthAccess) {
      assert(
        PrimitiveValuetypes.Text.isInternalValueRepresentation(
          this.valueKeywordValue,
        ),
      );
      return this.valueKeywordValue.length;
    }

    return this.valueKeywordValue;
  }
}

export type InternalValueRepresentationTypeguard<
  T extends InternalValueRepresentation,
> = (value: InternalValueRepresentation) => value is T;

export function evaluatePropertyValueExpression<
  T extends InternalValueRepresentation,
>(
  propertyValue: Expression | RuntimeParameterLiteral,
  evaluationContext: EvaluationContext,
  valuetype: Valuetype<T>,
): T | undefined {
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
  );
  return result;
}

export function evaluateExpression(
  expression: Expression,
  evaluationContext: EvaluationContext,
  context: ValidationContext | undefined = undefined,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
): InternalValueRepresentation | undefined {
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
