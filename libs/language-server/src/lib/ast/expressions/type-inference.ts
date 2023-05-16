// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  CollectionLiteral,
  Expression,
  ExpressionLiteral,
  ReferenceLiteral,
  isBinaryExpression,
  isBooleanLiteral,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintDefinition,
  isExpressionLiteral,
  isNumericLiteral,
  isReferenceLiteral,
  isRegexLiteral,
  isTextLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isUnaryExpression,
  isValuetypeAssignmentLiteral,
} from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../wrappers/value-type/primitive/primitive-valuetypes';
import { type Valuetype } from '../wrappers/value-type/valuetype';
import { createValuetype } from '../wrappers/value-type/valuetype-util';

import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export function inferExpressionType(
  expression: Expression | undefined,
  context: ValidationContext | undefined,
): Valuetype | undefined {
  if (expression === undefined) {
    return undefined;
  }
  if (isExpressionLiteral(expression)) {
    return inferTypeFromExpressionLiteral(expression);
  }
  if (isUnaryExpression(expression)) {
    const innerType = inferExpressionType(expression.expression, context);
    if (innerType === undefined) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer = unaryOperatorRegistry[operator].typeInference;
    return typeComputer.computeType(innerType, expression, context);
  }
  if (isBinaryExpression(expression)) {
    const leftType = inferExpressionType(expression.left, context);
    const rightType = inferExpressionType(expression.right, context);
    if (leftType === undefined || rightType === undefined) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer = binaryOperatorRegistry[operator].typeInference;
    return typeComputer.computeType(leftType, rightType, expression, context);
  }
  assertUnreachable(expression);
}

/**
 * @returns the resolved valuetype or undefined (e.g. if a reference is not resolved)
 */
function inferTypeFromExpressionLiteral(
  expression: ExpressionLiteral,
): Valuetype | undefined {
  if (isTextLiteral(expression)) {
    return PrimitiveValuetypes.Text;
  }
  if (isBooleanLiteral(expression)) {
    return PrimitiveValuetypes.Boolean;
  }
  if (isNumericLiteral(expression)) {
    if (Number.isInteger(expression.value)) {
      return PrimitiveValuetypes.Integer;
    }
    return PrimitiveValuetypes.Decimal;
  }
  if (isCellRangeLiteral(expression)) {
    return PrimitiveValuetypes.CellRange;
  }
  if (isRegexLiteral(expression)) {
    return PrimitiveValuetypes.Regex;
  }
  if (isValuetypeAssignmentLiteral(expression)) {
    return PrimitiveValuetypes.ValuetypeAssignment;
  }
  if (isCollectionLiteral(expression)) {
    return PrimitiveValuetypes.Collection;
  }
  if (isReferenceLiteral(expression)) {
    return inferTypeFromReferenceLiteral(expression);
  }
  assertUnreachable(expression);
}

function inferTypeFromReferenceLiteral(
  expression: ReferenceLiteral,
): Valuetype | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const referenced = expression?.value?.ref;
  if (referenced === undefined) {
    return undefined;
  }

  if (isConstraintDefinition(referenced)) {
    return PrimitiveValuetypes.Constraint;
  }
  if (isTransformDefinition(referenced)) {
    return PrimitiveValuetypes.Transform;
  }
  if (isTransformPortDefinition(referenced)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const valueType = referenced?.valueType;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (valueType === undefined) {
      return undefined;
    }
    return createValuetype(valueType);
  }
  assertUnreachable(referenced);
}

export interface TypedCollectionValidation {
  validItems: Expression[];
  invalidItems: Expression[];
}

export function validateTypedCollection(
  collection: CollectionLiteral,
  desiredTypes: Valuetype[],
  validationContext: ValidationContext | undefined,
): TypedCollectionValidation {
  const validItems = collection.values.filter((value) => {
    const valueType = inferExpressionType(value, validationContext);
    return valueType !== undefined && desiredTypes.includes(valueType);
  });
  const invalidItems = collection.values.filter(
    (value) => !validItems.includes(value),
  );

  return {
    validItems,
    invalidItems,
  };
}
