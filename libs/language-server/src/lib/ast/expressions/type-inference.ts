// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  CollectionLiteral,
  Expression,
  ExpressionLiteral,
  NumericLiteral,
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
import {
  AtomicValuetype,
  CollectionValuetype,
  PrimitiveValuetype,
  isAtomicValuetype,
  isPrimitiveValuetype,
} from '../wrappers';
import { EmptyCollection } from '../wrappers/value-type/primitive/collection/empty-collection-valuetype';
import { PrimitiveValuetypes } from '../wrappers/value-type/primitive/primitive-valuetypes';
import { type Valuetype } from '../wrappers/value-type/valuetype';
import { createValuetype } from '../wrappers/value-type/valuetype-util';

import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';
import { isEveryValueDefined } from './typeguards';

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
      return inferNumericType(expression);
    } else if (isCellRangeLiteral(expression)) {
      return PrimitiveValuetypes.CellRange;
    } else if (isRegexLiteral(expression)) {
      return PrimitiveValuetypes.Regex;
    } else if (isValuetypeAssignmentLiteral(expression)) {
      return PrimitiveValuetypes.ValuetypeAssignment;
    } else if (isCollectionLiteral(expression)) {
      return inferCollectionType(expression, context);
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

/**
 * Infers the numeric type dependent on the value parsed to TypeScript.
 * Thus, the inferred type might differ from the literal type.
 * E.g., 3.0 is currently interpreted as integer but is a DecimalLiteral.
 */
function inferNumericType(expression: NumericLiteral): Valuetype {
  if (Number.isInteger(expression.value)) {
    return PrimitiveValuetypes.Integer;
  }
  return PrimitiveValuetypes.Decimal;
}

function inferCollectionType(
  collection: CollectionLiteral,
  context: ValidationContext | undefined,
): Valuetype | undefined {
  const elementValuetypes = inferCollectionElementTypes(collection, context);
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
    context?.accept(
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
  context: ValidationContext | undefined,
): Valuetype[] | undefined {
  const elementValuetypes = collection.values.map((value) =>
    inferExpressionType(value, context),
  );
  if (!isEveryValueDefined(elementValuetypes)) {
    return undefined;
  }
  return elementValuetypes;
}

type ValuetypeHierarchyStack = [PrimitiveValuetype, ...AtomicValuetype[]];

function getValuetypeHierarchyStack(
  valuetype: Valuetype,
): ValuetypeHierarchyStack {
  if (isPrimitiveValuetype(valuetype)) {
    return [valuetype];
  } else if (isAtomicValuetype(valuetype)) {
    const supertype = valuetype.getSupertype();
    assert(supertype !== undefined);
    return [...getValuetypeHierarchyStack(supertype), valuetype];
  }
  throw new Error(
    'Should be unreachable, encountered an unknown kind of valuetype',
  );
}

function pickCommonPrimitiveValuetype(
  primitiveValuetypes: PrimitiveValuetype[],
): PrimitiveValuetype | undefined {
  assert(primitiveValuetypes.length > 0);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let resultingType: PrimitiveValuetype = primitiveValuetypes[0]!;
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

    // Unable to convert the valuetypes into each other, so there is no common primitive valuetype
    return undefined;
  }
  return resultingType;
}

function pickCommonAtomicValuetype(
  stacks: ValuetypeHierarchyStack[],
): Valuetype | undefined {
  const minimumStackLength = Math.min(...stacks.map((stack) => stack.length));

  let resultingType: Valuetype | undefined = undefined;
  for (let stackLevel = 1; stackLevel < minimumStackLength; ++stackLevel) {
    const typesOfCurrentLevel: Valuetype[] = stacks.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (stack) => stack[stackLevel]!,
    );

    if (!areAllTypesEqual(typesOfCurrentLevel)) {
      // Return the common valuetype of the previous level
      return resultingType;
    }

    // Pick any type of the current level since they are all equal
    resultingType = typesOfCurrentLevel[0];
  }
  return resultingType;
}

function areAllTypesEqual(types: Valuetype[]): boolean {
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
