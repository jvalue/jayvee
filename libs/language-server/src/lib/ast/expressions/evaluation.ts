// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { RuntimeParameterProvider } from '../../services';
import { ValidationContext } from '../../validation/validation-context';
import {
  Expression,
  FreeVariableLiteral,
  PropertyAssignment,
  ReferenceLiteral,
  ValueKeywordLiteral,
  ValueLiteral,
  isBinaryExpression,
  isBlocktypeProperty,
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
import { type Valuetype } from '../wrappers/value-type/valuetype';

import { type InternalValueRepresentation } from './internal-value-representation';
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
    if (isBlocktypeProperty(dereferenced)) {
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
