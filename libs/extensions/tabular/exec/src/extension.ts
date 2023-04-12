// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockExecutorClass,
  JayveeExecExtension,
} from '@jvalue/jayvee-execution';

import { CellRangeSelectorExecutor } from './lib/cell-range-selector-executor';
import { CellWriterExecutor } from './lib/cell-writer-executor';
import { ColumnDeleterExecutor } from './lib/column-deleter-executor';
import { CSVInterpreterExecutor } from './lib/csv-interpreter-executor';
import { RowDeleterExecutor } from './lib/row-deleter-executor';
import { TableInterpreterExecutor } from './lib/table-interpreter-executor';

export class TabularExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [
      CellWriterExecutor,
      ColumnDeleterExecutor,
      RowDeleterExecutor,
      CellRangeSelectorExecutor,
      TableInterpreterExecutor,
      CSVInterpreterExecutor,
    ];
  }
}
