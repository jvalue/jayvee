// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { OperandValue, OperandValueTypeguard } from './evaluation';

export const OPERAND_VALUE_TYPEGUARD: OperandValueTypeguard<OperandValue> = (
  value: OperandValue,
): value is OperandValue => {
  return true;
};
export const NUMBER_TYPEGUARD: OperandValueTypeguard<number> = (
  value: OperandValue,
): value is number => {
  return typeof value === 'number';
};
export const BOOLEAN_TYPEGUARD: OperandValueTypeguard<boolean> = (
  value: OperandValue,
): value is boolean => {
  return typeof value === 'boolean';
};
export const STRING_TYPEGUARD: OperandValueTypeguard<string> = (
  value: OperandValue,
): value is string => {
  return typeof value === 'string';
};
