// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ConstructorClass } from '@jvalue/jayvee-language-server';

import { type ConstraintExecutor } from './constraint-executor';

export interface TypedConstraintExecutorClass<
  T extends ConstraintExecutor = ConstraintExecutor,
> extends ConstructorClass<T> {
  readonly type: string;
}
