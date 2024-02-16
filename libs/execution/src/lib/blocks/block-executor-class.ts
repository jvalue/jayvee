// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ConstructorClass } from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { BlockExecutor } from './block-executor';

export interface BlockExecutorClass<T extends BlockExecutor = BlockExecutor>
  extends ConstructorClass<T> {
  readonly type: string;
}
