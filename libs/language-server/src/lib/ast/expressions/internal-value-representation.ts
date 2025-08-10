// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable, isAstNode } from 'langium';

import {
  type BlockTypeProperty,
  type CellRangeLiteral,
  type ConstraintDefinition,
  type TransformDefinition,
  type ValuetypeAssignment,
  isBlockTypeProperty,
  isCellRangeLiteral,
  isConstraintDefinition,
  isTransformDefinition,
  isValuetypeAssignment,
} from '../generated/ast';
import type { WrapperFactoryProvider } from '../wrappers';

import { COLLECTION_TYPEGUARD } from './typeguards';

export type InternalValueRepresentation =
  | AtomicInternalValueRepresentation
  | InternalValueRepresentation[];

export type AtomicInternalValueRepresentation =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeLiteral
  | ConstraintDefinition
  | ValuetypeAssignment
  | BlockTypeProperty
  | TransformDefinition;

export type InternalValueRepresentationTypeguard<
  T extends InternalValueRepresentation,
> = (value: unknown) => value is T;

export function internalValueToString(
  valueRepresentation: InternalValueRepresentation,
  wrapperFactories: WrapperFactoryProvider,
): string {
  if (Array.isArray(valueRepresentation)) {
    return (
      '[ ' +
      valueRepresentation
        .map((item) => internalValueToString(item, wrapperFactories))
        .join(', ') +
      ' ]'
    );
  }

  if (typeof valueRepresentation === 'boolean') {
    return String(valueRepresentation);
  }
  if (typeof valueRepresentation === 'number') {
    if (valueRepresentation === Number.POSITIVE_INFINITY) {
      return Number.MAX_VALUE.toLocaleString('fullwide', {
        useGrouping: false,
      });
    }
    if (valueRepresentation === Number.NEGATIVE_INFINITY) {
      return Number.MIN_VALUE.toLocaleString('fullwide', {
        useGrouping: false,
      });
    }
    return `${valueRepresentation}`;
  }
  if (typeof valueRepresentation === 'string') {
    return `"${valueRepresentation}"`;
  }
  if (valueRepresentation instanceof RegExp) {
    return valueRepresentation.source;
  }
  if (isCellRangeLiteral(valueRepresentation)) {
    return wrapperFactories.CellRange.wrap(valueRepresentation).toString();
  }
  if (isConstraintDefinition(valueRepresentation)) {
    return valueRepresentation.name;
  }
  if (isValuetypeAssignment(valueRepresentation)) {
    return valueRepresentation.name;
  }
  if (isTransformDefinition(valueRepresentation)) {
    return valueRepresentation.name;
  }
  if (isBlockTypeProperty(valueRepresentation)) {
    return valueRepresentation.name;
  }
  assertUnreachable(valueRepresentation);
}

export function cloneInternalValue<T extends InternalValueRepresentation>(
  valueRepresentation: T,
): T {
  if (COLLECTION_TYPEGUARD(valueRepresentation)) {
    return valueRepresentation.map(cloneInternalValue) as T;
  }

  if (
    typeof valueRepresentation === 'boolean' ||
    typeof valueRepresentation === 'number' ||
    typeof valueRepresentation === 'string'
  ) {
    return structuredClone(valueRepresentation);
  }
  if (valueRepresentation instanceof RegExp) {
    const cloned = structuredClone(valueRepresentation);
    cloned.lastIndex = valueRepresentation.lastIndex;
    return cloned;
  }
  if (isAstNode(valueRepresentation)) {
    return valueRepresentation;
  }
  assertUnreachable(valueRepresentation);
}
