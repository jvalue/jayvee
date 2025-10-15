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
import { collapseArray } from '../../../util';

export function pickCommonPrimitiveValuetype(
  valueTypes: ValueType[],
): PrimitiveValueType | undefined {
  const primitiveValueTypes = valueTypes.flatMap((valueType) => {
    while (!isPrimitiveValueType(valueType)) {
      const containedTypes = valueType.getContainedTypes();
      if (containedTypes === undefined) {
        return [];
      }
      const containedType = collapseArray(containedTypes);
      if (containedType === undefined) {
        return [];
      }
      valueType = containedType;
    }
    return [valueType];
  });
  if (primitiveValueTypes.length !== valueTypes.length) {
    return undefined;
  }

  let resultingType = primitiveValueTypes.pop();
  if (resultingType === undefined) {
    return undefined;
  }

  for (const currentType of primitiveValueTypes) {
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
  valueTypes: ValueType[],
): PrimitiveValueType | AtomicValueType | undefined {
  const expectedLevelLength = valueTypes.length;
  let currentLevel = valueTypes;
  let resultingType: PrimitiveValueType | AtomicValueType | undefined =
    undefined;

  while (currentLevel.length === expectedLevelLength) {
    if (!areAllTypesEqual(currentLevel)) {
      // Return the common value type of the previous level
      return resultingType;
    }

    // Pick any type of the current level since they are all equal
    assert(
      isPrimitiveValueType(currentLevel[0]) ||
        isAtomicValueType(currentLevel[0]),
    );
    resultingType = currentLevel[0];

    currentLevel = currentLevel.flatMap((valueType) => {
      if (isPrimitiveValueType(valueType)) {
        return [];
      } else if (isAtomicValueType(valueType)) {
        const containedTypes = valueType.getContainedTypes();
        assert(containedTypes !== undefined);
        const containedType = collapseArray(containedTypes);
        if (containedType === undefined) {
          return [];
        }
        assert(
          isPrimitiveValueType(containedType) ||
            isAtomicValueType(containedType),
        );
        return [containedType];
      }
      throw new Error(
        'Should be unreachable, encountered an unknown kind of value type',
      );
    });
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
