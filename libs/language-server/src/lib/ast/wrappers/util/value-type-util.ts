// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  isAtomicValueType,
} from '../value-type/atomic-value-type';
import {
  type PrimitiveValueType,
  isPrimitiveValueType,
} from '../value-type/primitive';
import { type ValueType } from '../value-type/value-type';

type ValuetypeHierarchyStack = [PrimitiveValueType, ...AtomicValueType[]];

export function getValuetypeHierarchyStack(
  valueType: ValueType,
): ValuetypeHierarchyStack {
  if (isPrimitiveValueType(valueType)) {
    return [valueType];
  } else if (isAtomicValueType(valueType)) {
    const supertype = valueType.getSupertype();
    assert(supertype !== undefined);
    return [...getValuetypeHierarchyStack(supertype), valueType];
  }
  throw new Error(
    'Should be unreachable, encountered an unknown kind of value type',
  );
}

export function pickCommonPrimitiveValuetype(
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

export function pickCommonAtomicValueType(
  stacks: ValuetypeHierarchyStack[],
): PrimitiveValueType | AtomicValueType | undefined {
  const minimumStackLength = Math.min(...stacks.map((stack) => stack.length));

  let resultingType: PrimitiveValueType | AtomicValueType | undefined =
    undefined;
  for (let stackLevel = 1; stackLevel < minimumStackLength; ++stackLevel) {
    const typesOfCurrentLevel: (PrimitiveValueType | AtomicValueType)[] =
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

export function areAllTypesEqual(types: ValueType[]): boolean {
  for (let i = 1; i < types.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const current = types[i - 1]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const afterCurrent = types[i]!;
    if (!current.equals(afterCurrent)) {
      return false;
    }
  }

  return true;
}
