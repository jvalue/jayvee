// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ConstructorClass } from '@jvalue/jayvee-language-server';

import { ConstraintExecutor } from './constraint-executor';

export interface ConstraintExecutorClass<
  T extends ConstraintExecutor = ConstraintExecutor,
> extends ConstructorClass<T> {
  readonly type: string;
}
