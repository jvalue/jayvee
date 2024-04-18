// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
import {
  type ValueType,
  type ValueTypeProvider,
  type WrapperFactoryProvider,
} from '../wrappers';
import {
  getValuetypeHierarchyStack,
  pickCommonAtomicValueType,
  pickCommonPrimitiveValuetype,
} from '../wrappers/util/value-type-util';

import { isEveryValueDefined } from './typeguards';

export function inferExpressionType(
  expression: Expression | undefined,
  validationContext: ValidationContext,
  valueTypeProvider: ValueTypeProvider,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  if (expression === undefined) {
    return undefined;
  }
  if (isExpressionLiteral(expression)) {
    return inferTypeFromExpressionLiteral(
      expression,
      validationContext,
      valueTypeProvider,
      wrapperFactories,
    );
  }
  if (isUnaryExpression(expression)) {
    const innerType = inferExpressionType(
      expression.expression,
      validationContext,
      valueTypeProvider,
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
      valueTypeProvider,
      wrapperFactories,
    );
    const rightType = inferExpressionType(
      expression.right,
      validationContext,
      valueTypeProvider,
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
      valueTypeProvider,
      wrapperFactories,
    );
    const secondType = inferExpressionType(
      expression.second,
      validationContext,
      valueTypeProvider,
      wrapperFactories,
    );
    const thirdType = inferExpressionType(
      expression.third,
      validationContext,
      valueTypeProvider,
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
  valueTypeProvider: ValueTypeProvider,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  if (isValueLiteral(expression)) {
    if (isTextLiteral(expression)) {
      return valueTypeProvider.Primitives.Text;
    } else if (isBooleanLiteral(expression)) {
      return valueTypeProvider.Primitives.Boolean;
    } else if (isNumericLiteral(expression)) {
      return inferNumericType(expression, valueTypeProvider);
    } else if (isCellRangeLiteral(expression)) {
      return valueTypeProvider.Primitives.CellRange;
    } else if (isRegexLiteral(expression)) {
      return valueTypeProvider.Primitives.Regex;
    } else if (isValuetypeAssignmentLiteral(expression)) {
      return valueTypeProvider.Primitives.ValuetypeAssignment;
    } else if (isCollectionLiteral(expression)) {
      return inferCollectionType(
        expression,
        validationContext,
        valueTypeProvider,
        wrapperFactories,
      );
    }
    assertUnreachable(expression);
  } else if (isFreeVariableLiteral(expression)) {
    if (isValueKeywordLiteral(expression)) {
      return inferTypeFromValueKeyword(
        expression,
        validationContext,
        valueTypeProvider,
        wrapperFactories,
      );
    } else if (isReferenceLiteral(expression)) {
      return inferTypeFromReferenceLiteral(
        expression,
        valueTypeProvider,
        wrapperFactories,
      );
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
  valueTypeProvider: ValueTypeProvider,
): ValueType {
  if (Number.isInteger(expression.value)) {
    return valueTypeProvider.Primitives.Integer;
  }
  return valueTypeProvider.Primitives.Decimal;
}

function inferCollectionType(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
  valueTypeProvider: ValueTypeProvider,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  const elementValuetypes = inferCollectionElementTypes(
    collection,
    validationContext,
    valueTypeProvider,
    wrapperFactories,
  );
  if (elementValuetypes === undefined) {
    return undefined;
  }

  const stacks = elementValuetypes.map(getValuetypeHierarchyStack);

  if (stacks.length === 0) {
    return valueTypeProvider.EmptyCollection;
  }
  if (stacks.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stack = stacks[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const resultingInnerType = stack[stack.length - 1]!;
    return valueTypeProvider.createCollectionValueTypeOf(resultingInnerType);
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

  const commonAtomicValueType = pickCommonAtomicValueType(stacks);
  if (commonAtomicValueType === undefined) {
    return valueTypeProvider.createCollectionValueTypeOf(
      commonPrimitiveValuetype,
    );
  }
  return valueTypeProvider.createCollectionValueTypeOf(commonAtomicValueType);
}

function inferCollectionElementTypes(
  collection: CollectionLiteral,
  validationContext: ValidationContext,
  valueTypeProvider: ValueTypeProvider,
  wrapperFactories: WrapperFactoryProvider,
): ValueType[] | undefined {
  const elementValuetypes = collection.values.map((value) =>
    inferExpressionType(
      value,
      validationContext,
      valueTypeProvider,
      wrapperFactories,
    ),
  );
  if (!isEveryValueDefined(elementValuetypes)) {
    return undefined;
  }
  return elementValuetypes;
}

function inferTypeFromValueKeyword(
  expression: ValueKeywordLiteral,
  validationContext: ValidationContext,
  valueTypeProvider: ValueTypeProvider,
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
    if (!valueType.isConvertibleTo(valueTypeProvider.Primitives.Text)) {
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
    return valueTypeProvider.Primitives.Integer;
  }
  return valueType;
}

function inferTypeFromReferenceLiteral(
  expression: ReferenceLiteral,
  valueTypeProvider: ValueTypeProvider,
  wrapperFactories: WrapperFactoryProvider,
): ValueType | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const referenced = expression?.value?.ref;
  if (referenced === undefined) {
    return undefined;
  }

  if (isConstraintDefinition(referenced)) {
    return valueTypeProvider.Primitives.Constraint;
  }
  if (isTransformDefinition(referenced)) {
    return valueTypeProvider.Primitives.Transform;
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
