// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { type ValidationContext } from '../../validation/validation-context';
import {
  type CollectionLiteral,
  type Expression,
  type ExpressionLiteral,
  type NumericLiteral,
  type ReferenceLiteral,
  type ValueKeywordLiteral,
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
// eslint-disable-next-line import/no-cycle
import {
  type AtomicValuetype,
  type PrimitiveValueType,
  type ValueType,
  type WrapperFactoryProvider,
  isAtomicValuetype,
  isPrimitiveValueType,
} from '../wrappers';

import { isEveryValueDefined } from './typeguards';

export function inferExpressionType(
  expression: Expression | undefined,
  validationContext: ValidationContext,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  if (expression === undefined) {
    return undefined;
  }
  if (isExpressionLiteral(expression)) {
    return inferTypeFromExpressionLiteral(
      expression,
      validationContext,
      wrapperFactories,
    );
  }
  if (isUnaryExpression(expression)) {
    const innerType = inferExpressionType(
      expression.expression,
      validationContext,
      wrapperFactories,
    );
    if (innerType === undefined) {
      return undefined;
    }

    const operator = expression.operator;
    const typeComputer = validationContext.typeComputerRegistry.unary[operator];
    return typeComputer.computeType(innerType, expression, validationContext);
  }
  if (isBinaryExpression(expression)) {
    const leftType = inferExpressionType(
      expression.left,
      validationContext,
      wrapperFactories,
    );
    const rightType = inferExpressionType(
      expression.right,
      validationContext,
      wrapperFactories,
    );
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
    const firstType = inferExpressionType(
      expression.first,
      validationContext,
      wrapperFactories,
    );
    const secondType = inferExpressionType(
      expression.second,
      validationContext,
      wrapperFactories,
    );
    const thirdType = inferExpressionType(
      expression.third,
      validationContext,
      wrapperFactories,
    );
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
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  if (isValueLiteral(expression)) {
    if (isTextLiteral(expression)) {
      return wrapperFactories.ValueType.Primitives.Text;
    } else if (isBooleanLiteral(expression)) {
      return wrapperFactories.ValueType.Primitives.Boolean;
    } else if (isNumericLiteral(expression)) {
      return inferNumericType(expression, wrapperFactories);
    } else if (isCellRangeLiteral(expression)) {
      return wrapperFactories.ValueType.Primitives.CellRange;
    } else if (isRegexLiteral(expression)) {
      return wrapperFactories.ValueType.Primitives.Regex;
    } else if (isValuetypeAssignmentLiteral(expression)) {
      return wrapperFactories.ValueType.Primitives.ValuetypeAssignment;
    } else if (isCollectionLiteral(expression)) {
      return inferCollectionType(
        expression,
        validationContext,
        wrapperFactories,
      );
    }
    assertUnreachable(expression);
  } else if (isFreeVariableLiteral(expression)) {
    if (isValueKeywordLiteral(expression)) {
      return inferTypeFromValueKeyword(
        expression,
        validationContext,
        wrapperFactories,
      );
    } else if (isReferenceLiteral(expression)) {
      return inferTypeFromReferenceLiteral(expression, wrapperFactories);
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
function inferNumericType(
  expression: NumericLiteral,
  wrapperFactories: WrapperFactoryProvider,
): ValueType {
  if (Number.isInteger(expression.value)) {
    return wrapperFactories.ValueType.Primitives.Integer;
  }
  return wrapperFactories.ValueType.Primitives.Decimal;
}

function inferCollectionType(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  const elementValuetypes = inferCollectionElementTypes(
    collection,
    validationContext,
    wrapperFactories,
  );
  if (elementValuetypes === undefined) {
    return undefined;
  }

  const stacks = elementValuetypes.map(getValuetypeHierarchyStack);

  if (stacks.length === 0) {
    return wrapperFactories.ValueType.EmptyCollection;
  }
  if (stacks.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stack = stacks[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const resultingInnerType = stack[stack.length - 1]!;
    return wrapperFactories.ValueType.createCollection(resultingInnerType);
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
    return wrapperFactories.ValueType.createCollection(
      commonPrimitiveValuetype,
    );
  }
  return wrapperFactories.ValueType.createCollection(commonAtomicValuetype);
}

function inferCollectionElementTypes(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
  wrapperFactories: WrapperFactoryProvider,
): ValueType[] | undefined {
  const elementValuetypes = collection.values.map((value) =>
    inferExpressionType(value, validationContext, wrapperFactories),
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
): PrimitiveValueType | AtomicValuetype | undefined {
  const minimumStackLength = Math.min(...stacks.map((stack) => stack.length));

  let resultingType: PrimitiveValueType | AtomicValuetype | undefined =
    undefined;
  for (let stackLevel = 1; stackLevel < minimumStackLength; ++stackLevel) {
    const typesOfCurrentLevel: (PrimitiveValueType | AtomicValuetype)[] =
      stacks.map(
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
  wrapperFactories: WrapperFactoryProvider,
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

  const valueType = wrapperFactories.ValueType.wrap(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expressionConstraintContainer?.valueType,
  );
  if (valueType === undefined) {
    return undefined;
  }

  if (expression.lengthAccess) {
    if (
      !valueType.isConvertibleTo(wrapperFactories.ValueType.Primitives.Text)
    ) {
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
    return wrapperFactories.ValueType.Primitives.Integer;
  }
  return valueType;
}

function inferTypeFromReferenceLiteral(
  expression: ReferenceLiteral,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const referenced = expression?.value?.ref;
  if (referenced === undefined) {
    return undefined;
  }

  if (isConstraintDefinition(referenced)) {
    return wrapperFactories.ValueType.Primitives.Constraint;
  }
  if (isTransformDefinition(referenced)) {
    return wrapperFactories.ValueType.Primitives.Transform;
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
    return wrapperFactories.ValueType.wrap(valueType);
  }
  assertUnreachable(referenced);
}
