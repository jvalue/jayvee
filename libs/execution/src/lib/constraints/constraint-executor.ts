// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export interface ConstraintExecutor {
  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean;
}
