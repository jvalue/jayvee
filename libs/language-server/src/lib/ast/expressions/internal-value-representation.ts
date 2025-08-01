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
  isBlockTypeProperty,
  isCellRangeLiteral,
  isConstraintDefinition,
  isTransformDefinition,
  isValuetypeAssignment,
} from '../generated/ast';
import { type WrapperFactoryProvider } from '../wrappers';

import { COLLECTION_TYPEGUARD } from './typeguards';

abstract class JayveeError extends Error {
  abstract override name: string;

  constructor(message: string) {
    super(message);
  }

  override toString(): string {
    return `${this.name}: ${this.message}`;
  }

  abstract clone(): JayveeError;
}

export class InvalidError extends JayveeError {
  public override name = 'InvalidError' as const;

  constructor(message: string, stack?: string) {
    super(message);
    if (stack !== undefined) {
      this.stack = stack;
    }
  }

  override clone(): InvalidError {
    return new InvalidError(this.message, this.stack);
  }
}

export class MissingError extends JayveeError {
  override name = 'MissingError' as const;

  override clone(): MissingError {
    const cloned = new MissingError(this.message);
    if (this.stack !== undefined) {
      cloned.stack = this.stack;
    }
    return cloned;
  }
}

export type InternalErrorRepresentation = InvalidError | MissingError;

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
  valueRepresentation: Exclude<InternalValueRepresentation, CellRangeLiteral>,
): string;
export function internalValueToString(
  valueRepresentation: InternalValueRepresentation,
  wrapperFactories: WrapperFactoryProvider,
): string;
export function internalValueToString(
  valueRepresentation: InternalValueRepresentation,
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
