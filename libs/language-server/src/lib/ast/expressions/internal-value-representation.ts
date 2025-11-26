// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { assertUnreachable, isAstNode } from 'langium';

import {
  type BlockTypeProperty,
  type CellRangeLiteral,
  type ConstraintDefinition,
  type TransformDefinition,
  type ValuetypeAssignment,
  type ValuetypeDefinition,
  isBlockTypeProperty,
  isCellRangeLiteral,
  isConstraintDefinition,
  isTransformDefinition,
  isValuetypeAssignment,
  isValuetypeDefinition,
} from '../generated/ast';
import { type WrapperFactoryProvider } from '../wrappers';

import { COLLECTION_TYPEGUARD, ERROR_TYPEGUARD } from './typeguards';

// INFO: `ErroneousValue` extends `Error` in order to make use of the `stack`
// property.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
abstract class ErroneousValue extends Error {
  abstract override name: string;

  constructor(message: string) {
    super(message);
  }

  override toString(): string {
    return `${this.name}: ${this.message}`;
  }

  abstract clone(): ErroneousValue;
}

export class InvalidValue extends ErroneousValue {
  public override name = 'InvalidValue' as const;

  constructor(message: string, stack?: string) {
    super(message);
    if (stack !== undefined) {
      this.stack = stack;
    }
  }

  override clone(): InvalidValue {
    return new InvalidValue(this.message, this.stack);
  }
}

export class MissingValue extends ErroneousValue {
  override name = 'MissingValue' as const;

  override clone(): MissingValue {
    const cloned = new MissingValue(this.message);
    if (this.stack !== undefined) {
      cloned.stack = this.stack;
    }
    return cloned;
  }
}

export type InternalErrorValueRepresentation = InvalidValue | MissingValue;

export type InternalValidValueRepresentation =
  | AtomicInternalValidValueRepresentation
  | (InternalValidValueRepresentation | InternalErrorValueRepresentation)[];

export type AtomicInternalValidValueRepresentation =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeLiteral
  | ConstraintDefinition
  | ValuetypeAssignment
  | ValuetypeDefinition
  | BlockTypeProperty
  | TransformDefinition;

export type InternalValidValueRepresentationTypeguard<
  T extends InternalValidValueRepresentation,
> = (value: unknown) => value is T;

export function internalValueToString(
  valueRepresentation: Exclude<
    InternalValidValueRepresentation,
    CellRangeLiteral
  >,
): string;
export function internalValueToString(
  valueRepresentation: InternalValidValueRepresentation,
  wrapperFactories: WrapperFactoryProvider,
): string;
export function internalValueToString(
  valueRepresentation: InternalValidValueRepresentation,
  wrapperFactories?: WrapperFactoryProvider,
): string {
  if (Array.isArray(valueRepresentation)) {
    return (
      '[ ' +
      valueRepresentation
        .map((value) => {
          if (isCellRangeLiteral(value)) {
            assert(wrapperFactories !== undefined);
            return internalValueToString(value, wrapperFactories);
          }
          if (ERROR_TYPEGUARD(value)) {
            return value.name;
          }
          return internalValueToString(value);
        })
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
    assert(wrapperFactories !== undefined);
    return wrapperFactories.CellRange.wrap(valueRepresentation).toString();
  }
  if (isConstraintDefinition(valueRepresentation)) {
    return valueRepresentation.name;
  }
  if (isValuetypeAssignment(valueRepresentation)) {
    return valueRepresentation.name;
  }
  if (isValuetypeDefinition(valueRepresentation)) {
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

export function cloneInternalValue<
  T extends InternalValidValueRepresentation | InternalErrorValueRepresentation,
>(valueRepresentation: T): T {
  if (COLLECTION_TYPEGUARD(valueRepresentation)) {
    return valueRepresentation.map(cloneInternalValue) as T;
  }

  if (ERROR_TYPEGUARD(valueRepresentation)) {
    return valueRepresentation.clone() as T;
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
