// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  Expression,
  ExpressionLiteral,
  PropertyValueLiteral,
  isBinaryExpression,
  isBooleanLiteral,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintReferenceLiteral,
  isExpression,
  isExpressionLiteral,
  isNumericLiteral,
  isRegexLiteral,
  isTextLiteral,
  isUnaryExpression,
  isValuetypeAssignmentLiteral,
} from '../generated/ast';
import { PropertyValuetype } from '../model-util';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export function inferExpressionType(
  expression: Expression | undefined,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
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

function inferTypeFromExpressionLiteral(
  expression: ExpressionLiteral,
): PropertyValuetype {
  if (isTextLiteral(expression)) {
    return PropertyValuetype.TEXT;
  }
  if (isBooleanLiteral(expression)) {
    return PropertyValuetype.BOOLEAN;
  }
  if (isNumericLiteral(expression)) {
    if (Number.isInteger(expression.value)) {
      return PropertyValuetype.INTEGER;
    }
    return PropertyValuetype.DECIMAL;
  }
  if (isCellRangeLiteral(expression)) {
    return PropertyValuetype.CELL_RANGE;
  }
  if (isConstraintReferenceLiteral(expression)) {
    return PropertyValuetype.CONSTRAINT;
  }
  if (isRegexLiteral(expression)) {
    return PropertyValuetype.REGEX;
  }
  if (isValuetypeAssignmentLiteral(expression)) {
    return PropertyValuetype.VALUETYPE_ASSIGNMENT;
  }
  assertUnreachable(expression);
}

export function generateUnexpectedTypeMessage(
  expectedTypes: PropertyValuetype | PropertyValuetype[],
  actualType: PropertyValuetype,
) {
  return `The operand needs to be of type ${
    Array.isArray(expectedTypes) ? expectedTypes.join(' or ') : expectedTypes
  } but is of type ${actualType}`;
}

export function inferTypeFromValue(
  value: PropertyValueLiteral,
  context?: ValidationContext,
): PropertyValuetype | undefined {
  if (isCollectionLiteral(value)) {
    return PropertyValuetype.COLLECTION;
  }
  if (isExpression(value)) {
    return inferExpressionType(value, context);
  }
  assertUnreachable(value);
}
