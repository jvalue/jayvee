// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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

import {
  type AtomicInternalValidValueRepresentation,
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  type InternalValidValueRepresentationTypeguard,
  type InvalidValue,
  type MissingValue,
} from './internal-value-representation';

export const INTERNAL_VALID_VALUE_REPRESENTATION_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  InternalValidValueRepresentation
> = (value): value is InternalValidValueRepresentation =>
  ATOMIC_INTERNAL_VALUE_REPRESENTATION_TYPEGUARD(value) ||
  COLLECTION_TYPEGUARD(value);

export const ATOMIC_INTERNAL_VALUE_REPRESENTATION_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  AtomicInternalValidValueRepresentation
> = (value): value is AtomicInternalValidValueRepresentation =>
  BOOLEAN_TYPEGUARD(value) ||
  NUMBER_TYPEGUARD(value) ||
  STRING_TYPEGUARD(value) ||
  CELLRANGELITERAL_TYPEGUARD(value) ||
  CONSTRAINTDEFINITION_TYPEGUARD(value) ||
  VALUETYPEASSIGNMENT_TYPEGUARD(value) ||
  BLOCKTYPEPROPERTY_TYPEGUARD(value) ||
  TRANSFORMDEFINITION_TYPEGUARD(value);

export const NUMBER_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  number
> = (value) => typeof value === 'number';
export const BOOLEAN_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  boolean
> = (value) => typeof value === 'boolean';
export const STRING_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  string
> = (value) => typeof value === 'string';

export const REGEXP_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  RegExp
> = (value) => value instanceof RegExp;

export const CELLRANGELITERAL_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  CellRangeLiteral
> = (value) => isCellRangeLiteral(value);

export const CONSTRAINTDEFINITION_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  ConstraintDefinition
> = (value) => isConstraintDefinition(value);

export const VALUETYPEASSIGNMENT_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  ValuetypeAssignment
> = (value) => isValuetypeAssignment(value);

export const BLOCKTYPEPROPERTY_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  BlockTypeProperty
> = (value) => isBlockTypeProperty(value);

export const TRANSFORMDEFINITION_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  TransformDefinition
> = (value) => isTransformDefinition(value);

export const COLLECTION_TYPEGUARD: InternalValidValueRepresentationTypeguard<
  (InternalValidValueRepresentation | InternalErrorValueRepresentation)[]
> = (value) =>
  Array.isArray(value) &&
  value.every(
    (v) =>
      INTERNAL_VALID_VALUE_REPRESENTATION_TYPEGUARD(v) || ERROR_TYPEGUARD(v),
  );

export const INVALID_TYPEGUARD = (value: unknown): value is InvalidValue => {
  return value instanceof Error && value.name === 'InvalidValue';
};

export const MISSING_TYPEGUARD = (value: unknown): value is MissingValue => {
  return value instanceof Error && value.name === 'MissingValue';
};

export const ERROR_TYPEGUARD = (
  value: unknown,
): value is InternalErrorValueRepresentation => {
  return INVALID_TYPEGUARD(value) || MISSING_TYPEGUARD(value);
};
