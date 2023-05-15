// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  InternalValueRepresentation,
  OperandValueTypeguard,
} from './evaluation';

export const OPERAND_VALUE_TYPEGUARD: OperandValueTypeguard<
  InternalValueRepresentation
> = (
  value: InternalValueRepresentation,
): value is InternalValueRepresentation => {
  return true;
};
export const NUMBER_TYPEGUARD: OperandValueTypeguard<number> = (
  value: InternalValueRepresentation,
): value is number => {
  return typeof value === 'number';
};
export const BOOLEAN_TYPEGUARD: OperandValueTypeguard<boolean> = (
  value: InternalValueRepresentation,
): value is boolean => {
  return typeof value === 'boolean';
};
export const STRING_TYPEGUARD: OperandValueTypeguard<string> = (
  value: InternalValueRepresentation,
): value is string => {
  return typeof value === 'string';
};
