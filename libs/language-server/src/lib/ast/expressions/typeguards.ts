// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalValueRepresentation,
  type InternalValueRepresentationTypeguard,
} from './internal-value-representation';

export const INTERNAL_VALUE_REPRESENTATION_TYPEGUARD: InternalValueRepresentationTypeguard<
  InternalValueRepresentation
> = (
  value: InternalValueRepresentation,
): value is InternalValueRepresentation => {
  return true;
};
export const NUMBER_TYPEGUARD: InternalValueRepresentationTypeguard<number> = (
  value: InternalValueRepresentation,
): value is number => {
  return typeof value === 'number';
};
export const BOOLEAN_TYPEGUARD: InternalValueRepresentationTypeguard<
  boolean
> = (value: InternalValueRepresentation): value is boolean => {
  return typeof value === 'boolean';
};
export const STRING_TYPEGUARD: InternalValueRepresentationTypeguard<string> = (
  value: InternalValueRepresentation,
): value is string => {
  return typeof value === 'string';
};

export const REGEXP_TYPEGUARD: InternalValueRepresentationTypeguard<RegExp> = (
  value: InternalValueRepresentation,
): value is RegExp => {
  return value instanceof RegExp;
};

export function isEveryValueDefined<T>(array: (T | undefined)[]): array is T[] {
  return array.every((value) => value !== undefined);
}
