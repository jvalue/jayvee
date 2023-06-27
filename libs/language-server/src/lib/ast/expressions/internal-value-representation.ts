// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
    return (
      '[ ' +
      valueRepresentation
        .map((item) => internalValueToString(item))
        .join(', ') +
      ' ]'
    );
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
  if (valueRepresentation instanceof RegExp) {
    return valueRepresentation.source;
  }
  if (valueRepresentation instanceof CellRangeWrapper) {
    return valueRepresentation.toString();
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
  throw new Error(
    'Convert of this InternalValueRepresentation is not implemented',
  );
}
