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
  ValueKeywordLiteral,
  isBinaryExpression,
  isBooleanLiteral,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintDefinition,
  isExpressionConstraintDefinition,
  isExpressionLiteral,
  isFreeVariableLiteral,
  isNumericLiteral,
  isReferenceLiteral,
  isRegexLiteral,
  isTextLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isUnaryExpression,
  isValueKeywordLiteral,
  isValueLiteral,
  isValuetypeAssignmentLiteral,
} from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import { getNextAstNodeContainer } from '../model-util';
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
    return inferTypeFromExpressionLiteral(expression, context);
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
  context: ValidationContext | undefined,
): Valuetype | undefined {
  if (isValueLiteral(expression)) {
    if (isTextLiteral(expression)) {
      return PrimitiveValuetypes.Text;
    } else if (isBooleanLiteral(expression)) {
      return PrimitiveValuetypes.Boolean;
    } else if (isNumericLiteral(expression)) {
      if (Number.isInteger(expression.value)) {
        return PrimitiveValuetypes.Integer;
      }
      return PrimitiveValuetypes.Decimal;
    } else if (isCellRangeLiteral(expression)) {
      return PrimitiveValuetypes.CellRange;
    } else if (isRegexLiteral(expression)) {
      return PrimitiveValuetypes.Regex;
    } else if (isValuetypeAssignmentLiteral(expression)) {
      return PrimitiveValuetypes.ValuetypeAssignment;
    } else if (isCollectionLiteral(expression)) {
      return PrimitiveValuetypes.Collection;
    }
    assertUnreachable(expression);
  } else if (isFreeVariableLiteral(expression)) {
    if (isValueKeywordLiteral(expression)) {
      return inferTypeFromValueKeyword(expression, context);
    } else if (isReferenceLiteral(expression)) {
      return inferTypeFromReferenceLiteral(expression);
    }
    assertUnreachable(expression);
  }
  assertUnreachable(expression);
}

function inferTypeFromValueKeyword(
  expression: ValueKeywordLiteral,
  context: ValidationContext | undefined,
): Valuetype | undefined {
  const expressionConstraintContainer = getNextAstNodeContainer(
    expression,
    isExpressionConstraintDefinition,
  );
  if (expressionConstraintContainer === undefined) {
    context?.accept(
      'error',
      'The value keyword is not allowed in this context',
      {
        node: expression,
      },
    );
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const valuetype = createValuetype(expressionConstraintContainer?.valuetype);
  if (valuetype === undefined) {
    return undefined;
  }

  if (expression.lengthAccess) {
    if (!valuetype.isConvertibleTo(PrimitiveValuetypes.Text)) {
      context?.accept(
        'error',
        'The length can only be accessed from text values ',
        {
          node: expression,
          keyword: 'length',
        },
      );
      return undefined;
    }
    return PrimitiveValuetypes.Integer;
  }
  return valuetype;
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
