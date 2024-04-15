// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockExecutorClass,
  JayveeExecExtension,
} from '@jvalue/jayvee-execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension extends JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
