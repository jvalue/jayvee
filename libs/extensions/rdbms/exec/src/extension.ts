// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import type { BlockExecutorClass } from '@jvalue/jayvee-execution';
import { JayveeExecExtension } from '@jvalue/jayvee-execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension extends JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
