// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/// If the array has exactly one element, that element is returned. Otherwise
/// undefined
export function collapseArray<T>(array: T[]): T | undefined {
  return array.length == 1 ? array[0] : undefined;
}
