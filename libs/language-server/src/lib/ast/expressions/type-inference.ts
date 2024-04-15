// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import type { ValidationContext } from '../../validation/validation-context';
import type {
  CollectionLiteral,
  Expression,
  ExpressionLiteral,
  NumericLiteral,
  ReferenceLiteral,
  ValueKeywordLiteral,
} from '../generated/ast';
import {
  isBinaryExpression,
  isBlockTypeProperty,
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
  isTernaryExpression,
  isTextLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isUnaryExpression,
  isValueKeywordLiteral,
  isValueLiteral,
  isValuetypeAssignmentLiteral,
} from '../generated/ast';
import { getNextAstNodeContainer } from '../model-util';
import type { AtomicValuetype, PrimitiveValueType } from '../wrappers';
// eslint-disable-next-line import/no-cycle
import {
  CollectionValuetype,
  isAtomicValuetype,
  isPrimitiveValueType,
} from '../wrappers';
import { EmptyCollection } from '../wrappers/value-type/primitive/collection/empty-collection-value-type';
import { PrimitiveValuetypes } from '../wrappers/value-type/primitive/primitive-value-types';
import { type ValueType } from '../wrappers/value-type/value-type';
import { createValueType } from '../wrappers/value-type/value-type-util';

import { isEveryValueDefined } from './typeguards';

export function inferExpressionType(
  expression: Expression | undefined,
  validationContext: ValidationContext,
): ValueType | undefined {
  if (expression === undefined) {
    return undefined;
  }
  if (isExpressionLiteral(expression)) {
    return inferTypeFromExpressionLiteral(expression, validationContext);
  }
  if (isUnaryExpression(expression)) {
    const innerType = inferExpressionType(
      expression.expression,
      validationContext,
    );
    if (innerType === undefined) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer = validationContext.typeComputerRegistry.unary[operator];
    return typeComputer.computeType(innerType, expression, validationContext);
  }
  if (isBinaryExpression(expression)) {
    const leftType = inferExpressionType(expression.left, validationContext);
    const rightType = inferExpressionType(expression.right, validationContext);
    if (leftType === undefined || rightType === undefined) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer =
      validationContext.typeComputerRegistry.binary[operator];
    return typeComputer.computeType(
      leftType,
      rightType,
      expression,
      validationContext,
    );
  }
  if (isTernaryExpression(expression)) {
    const firstType = inferExpressionType(expression.first, validationContext);
    const secondType = inferExpressionType(
      expression.second,
      validationContext,
    );
    const thirdType = inferExpressionType(expression.third, validationContext);
    if (
      firstType === undefined ||
      secondType === undefined ||
      thirdType === undefined
    ) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer =
      validationContext.typeComputerRegistry.ternary[operator];
    return typeComputer.computeType(
      firstType,
      secondType,
      thirdType,
      expression,
      validationContext,
    );
  }
  assertUnreachable(expression);
}

/**
 * @returns the resolved value type or undefined (e.g. if a reference is not resolved)
 */
function inferTypeFromExpressionLiteral(
  expression: ExpressionLiteral,
  validationContext: ValidationContext,
): ValueType | undefined {
  if (isValueLiteral(expression)) {
    if (isTextLiteral(expression)) {
      return PrimitiveValuetypes.Text;
    } else if (isBooleanLiteral(expression)) {
      return PrimitiveValuetypes.Boolean;
    } else if (isNumericLiteral(expression)) {
      return inferNumericType(expression);
    } else if (isCellRangeLiteral(expression)) {
      return PrimitiveValuetypes.CellRange;
    } else if (isRegexLiteral(expression)) {
      return PrimitiveValuetypes.Regex;
    } else if (isValuetypeAssignmentLiteral(expression)) {
      return PrimitiveValuetypes.ValuetypeAssignment;
    } else if (isCollectionLiteral(expression)) {
      return inferCollectionType(expression, validationContext);
    }
    assertUnreachable(expression);
  } else if (isFreeVariableLiteral(expression)) {
    if (isValueKeywordLiteral(expression)) {
      return inferTypeFromValueKeyword(expression, validationContext);
    } else if (isReferenceLiteral(expression)) {
      return inferTypeFromReferenceLiteral(expression);
    }
    assertUnreachable(expression);
  }
  assertUnreachable(expression);
}

/**
 * Infers the numeric type dependent on the value parsed to TypeScript.
 * Thus, the inferred type might differ from the literal type.
 * E.g., 3.0 is currently interpreted as integer but is a DecimalLiteral.
 */
function inferNumericType(expression: NumericLiteral): ValueType {
  if (Number.isInteger(expression.value)) {
    return PrimitiveValuetypes.Integer;
  }
  return PrimitiveValuetypes.Decimal;
}

function inferCollectionType(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
): ValueType | undefined {
  const elementValuetypes = inferCollectionElementTypes(
    collection,
    validationContext,
  );
  if (elementValuetypes === undefined) {
    return undefined;
  }

  const stacks = elementValuetypes.map(getValuetypeHierarchyStack);

  if (stacks.length === 0) {
    return EmptyCollection;
  }
  if (stacks.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stack = stacks[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const resultingInnerType = stack[stack.length - 1]!;
    return new CollectionValuetype(resultingInnerType);
  }

  const primitiveValuetypes = stacks.map((stack) => stack[0]);

  const commonPrimitiveValuetype =
    pickCommonPrimitiveValuetype(primitiveValuetypes);

  if (commonPrimitiveValuetype === undefined) {
    validationContext.accept(
      'error',
      'The type of the collection cannot be inferred from its elements',
      {
        node: collection,
      },
    );
    return undefined;
  }

  const commonAtomicValuetype = pickCommonAtomicValuetype(stacks);
  if (commonAtomicValuetype === undefined) {
    return new CollectionValuetype(commonPrimitiveValuetype);
  }
  return new CollectionValuetype(commonAtomicValuetype);
}

function inferCollectionElementTypes(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
): ValueType[] | undefined {
  const elementValuetypes = collection.values.map((value) =>
    inferExpressionType(value, validationContext),
  );
  if (!isEveryValueDefined(elementValuetypes)) {
    return undefined;
  }
  return elementValuetypes;
}

type ValuetypeHierarchyStack = [PrimitiveValueType, ...AtomicValuetype[]];

function getValuetypeHierarchyStack(
  valueType: ValueType,
): ValuetypeHierarchyStack {
  if (isPrimitiveValueType(valueType)) {
    return [valueType];
  } else if (isAtomicValuetype(valueType)) {
    const supertype = valueType.getSupertype();
    assert(supertype !== undefined);
    return [...getValuetypeHierarchyStack(supertype), valueType];
  }
  throw new Error(
    'Should be unreachable, encountered an unknown kind of value type',
  );
}

function pickCommonPrimitiveValuetype(
  primitiveValuetypes: PrimitiveValueType[],
): PrimitiveValueType | undefined {
  assert(primitiveValuetypes.length > 0);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let resultingType: PrimitiveValueType = primitiveValuetypes[0]!;
  for (let i = 1; i < primitiveValuetypes.length; ++i) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentType = primitiveValuetypes[i]!;

    if (currentType.isConvertibleTo(resultingType)) {
      continue;
    }

    if (resultingType.isConvertibleTo(currentType)) {
      // Pick the more general type as a result
      resultingType = currentType;
      continue;
    }

    // Unable to convert the value types into each other, so there is no common primitive value type
    return undefined;
  }
  return resultingType;
}

function pickCommonAtomicValuetype(
  stacks: ValuetypeHierarchyStack[],
): ValueType | undefined {
  const minimumStackLength = Math.min(...stacks.map((stack) => stack.length));

  let resultingType: ValueType | undefined = undefined;
  for (let stackLevel = 1; stackLevel < minimumStackLength; ++stackLevel) {
    const typesOfCurrentLevel: ValueType[] = stacks.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (stack) => stack[stackLevel]!,
    );

    if (!areAllTypesEqual(typesOfCurrentLevel)) {
      // Return the common value type of the previous level
      return resultingType;
    }

    // Pick any type of the current level since they are all equal
    resultingType = typesOfCurrentLevel[0];
  }
  return resultingType;
}

function areAllTypesEqual(types: ValueType[]): boolean {
  for (let i = 1; i < types.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!types[i - 1]!.equals(types[i]!)) {
      return false;
    }
  }

  return true;
}

function inferTypeFromValueKeyword(
  expression: ValueKeywordLiteral,
  validationContext: ValidationContext,
): ValueType | undefined {
  const expressionConstraintContainer = getNextAstNodeContainer(
    expression,
    isExpressionConstraintDefinition,
  );
  if (expressionConstraintContainer === undefined) {
    validationContext.accept(
      'error',
      'The value keyword is not allowed in this context',
      {
        node: expression,
      },
    );
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const valueType = createValueType(expressionConstraintContainer?.valueType);
  if (valueType === undefined) {
    return undefined;
  }

  if (expression.lengthAccess) {
    if (!valueType.isConvertibleTo(PrimitiveValuetypes.Text)) {
      validationContext.accept(
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
  return valueType;
}

function inferTypeFromReferenceLiteral(
  expression: ReferenceLiteral,
): ValueType | undefined {
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
  if (
    isTransformPortDefinition(referenced) ||
    isBlockTypeProperty(referenced)
  ) {
    const valueType = referenced.valueType;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (valueType === undefined) {
      return undefined;
    }
    return createValueType(valueType);
  }
  assertUnreachable(referenced);
}
