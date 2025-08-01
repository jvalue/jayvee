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
  type AtomicInternalValueRepresentation,
  type InternalErrorRepresentation,
  type InternalValueRepresentation,
  type InternalValueRepresentationTypeguard,
  type InvalidError,
  type MissingError,
} from './internal-value-representation';

export const INTERNAL_VALUE_REPRESENTATION_TYPEGUARD: InternalValueRepresentationTypeguard<
  InternalValueRepresentation
> = (value): value is InternalValueRepresentation => {
  return (
    ATOMIC_INTERNAL_VALUE_REPRESENTATION_TYPEGUARD(value) ||
    COLLECTION_TYPEGUARD(value)
  );
};

export const ATOMIC_INTERNAL_VALUE_REPRESENTATION_TYPEGUARD: InternalValueRepresentationTypeguard<
  AtomicInternalValueRepresentation
> = (value): value is AtomicInternalValueRepresentation =>
  BOOLEAN_TYPEGUARD(value) ||
  NUMBER_TYPEGUARD(value) ||
  STRING_TYPEGUARD(value) ||
  CELLRANGELITERAL_TYPEGUARD(value) ||
  CONSTRAINTDEFINITION_TYPEGUARD(value) ||
  VALUETYPEASSIGNMENT_TYPEGUARD(value) ||
  BLOCKTYPEPROPERTY_TYPEGUARD(value) ||
  TRANSFORMDEFINITION_TYPEGUARD(value);

export const NUMBER_TYPEGUARD: InternalValueRepresentationTypeguard<number> = (
  value,
) => typeof value === 'number';
export const BOOLEAN_TYPEGUARD: InternalValueRepresentationTypeguard<
  boolean
> = (value) => typeof value === 'boolean';
export const STRING_TYPEGUARD: InternalValueRepresentationTypeguard<string> = (
  value,
) => typeof value === 'string';

export const REGEXP_TYPEGUARD: InternalValueRepresentationTypeguard<RegExp> = (
  value,
) => value instanceof RegExp;

export const CELLRANGELITERAL_TYPEGUARD: InternalValueRepresentationTypeguard<
  CellRangeLiteral
> = (value) => isCellRangeLiteral(value);

export const CONSTRAINTDEFINITION_TYPEGUARD: InternalValueRepresentationTypeguard<
  ConstraintDefinition
> = (value) => isConstraintDefinition(value);

export const VALUETYPEASSIGNMENT_TYPEGUARD: InternalValueRepresentationTypeguard<
  ValuetypeAssignment
> = (value) => isValuetypeAssignment(value);

export const BLOCKTYPEPROPERTY_TYPEGUARD: InternalValueRepresentationTypeguard<
  BlockTypeProperty
> = (value) => isBlockTypeProperty(value);

export const TRANSFORMDEFINITION_TYPEGUARD: InternalValueRepresentationTypeguard<
  TransformDefinition
> = (value) => isTransformDefinition(value);

export const COLLECTION_TYPEGUARD: InternalValueRepresentationTypeguard<
  InternalValueRepresentation[]
> = (value) =>
  Array.isArray(value) &&
  value.every((v) => INTERNAL_VALUE_REPRESENTATION_TYPEGUARD(v));

export const INVALID_TYPEGUARD = (value: unknown): value is InvalidError => {
  return value instanceof Error && value.name === 'InvalidError';
};

export const MISSING_TYPEGUARD = (value: unknown): value is MissingError => {
  return value instanceof Error && value.name === 'MissingError';
};

export const ERROR_TYPEGUARD = (
  value: unknown,
): value is InternalErrorRepresentation => {
  return INVALID_TYPEGUARD(value) || MISSING_TYPEGUARD(value);
};
