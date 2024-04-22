// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockExecutorClass,
  JayveeExecExtension,
} from '@jvalue/jayvee-execution';

import { CellRangeSelectorExecutor } from './lib/cell-range-selector-executor.js';
import { CellWriterExecutor } from './lib/cell-writer-executor.js';
import { ColumnDeleterExecutor } from './lib/column-deleter-executor.js';
import { CSVInterpreterExecutor } from './lib/csv-interpreter-executor.js';
import { RowDeleterExecutor } from './lib/row-deleter-executor.js';
import { SheetPickerExecutor } from './lib/sheet-picker-executor.js';
import { TableInterpreterExecutor } from './lib/table-interpreter-executor.js';
import { TableTransformerExecutor } from './lib/table-transformer-executor.js';
import { XLSXInterpreterExecutor } from './lib/xlsx-interpreter-executor.js';

export class TabularExecExtension extends JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [
      CellWriterExecutor,
      ColumnDeleterExecutor,
      RowDeleterExecutor,
      CellRangeSelectorExecutor,
      TableInterpreterExecutor,
      CSVInterpreterExecutor,
      TableTransformerExecutor,
      XLSXInterpreterExecutor,
      SheetPickerExecutor,
    ];
  }
}
