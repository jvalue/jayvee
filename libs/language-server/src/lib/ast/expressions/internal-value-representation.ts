// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { isRegExp } from 'util';

import {
  ConstraintDefinition,
  TransformDefinition,
  ValuetypeAssignment,
  isConstraintDefinition,
  isTransformDefinition,
  isValuetypeAssignment,
} from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import { CellRangeWrapper } from '../wrappers';

export type InternalValueRepresentation =
  | AtomicInternalValueRepresentation
  | Array<InternalValueRepresentation>
  | [];

export type AtomicInternalValueRepresentation =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeWrapper
  | ConstraintDefinition
  | ValuetypeAssignment
  | TransformDefinition;

export type InternalValueRepresentationTypeguard<
  T extends InternalValueRepresentation,
> = (value: InternalValueRepresentation) => value is T;

export function internalValueToString(
  valueRepresentation: InternalValueRepresentation,
): string {
  if (Array.isArray(valueRepresentation)) {
    // TODO;
  }

  if (typeof valueRepresentation === 'boolean') {
    return String(valueRepresentation);
  }
  if (typeof valueRepresentation === 'number') {
    return `${valueRepresentation}`;
  }
  if (typeof valueRepresentation === 'string') {
    return `"${valueRepresentation}"`;
  }
  if (isRegExp(valueRepresentation)) {
    return valueRepresentation.source;
  }
  if (valueRepresentation instanceof CellRangeWrapper) {
    return valueRepresentation.toString();
  }
  if (isConstraintDefinition(valueRepresentation)) {
    return valueRepresentation.name; // TODO: not sure if this makes sense?
  }
  if (isValuetypeAssignment(valueRepresentation)) {
    return valueRepresentation.name; // TODO: not sure if this makes sense?
  }
  if (isTransformDefinition(valueRepresentation)) {
    return valueRepresentation.name; // TODO: not sure if this makes sense?
  }
  throw new Error(
    'Convert of this InternalValueRepresentation is not implemented',
  );
}
