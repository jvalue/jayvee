// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { blockExecutorRegistry, constraintExecutorRegistry } from '../src';

export function clearBlockExecutorRegistry() {
  blockExecutorRegistry.clear();
}

export function clearConstraintExecutorRegistry() {
  constraintExecutorRegistry.clear();
}
