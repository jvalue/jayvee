// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockExecutorClass,
  JayveeExecExtension,
} from '@jvalue/jayvee-execution';
import { RdbmsExecExtension } from '@jvalue/jayvee-extensions/rdbms/exec';
import { TabularExecExtension } from '@jvalue/jayvee-extensions/tabular/exec';

import { ArchiveInterpreterExecutor } from './archive-interpreter-executor';
import { FilePickerExecutor } from './file-picker-executor';
import { GtfsRTInterpreterExecutor } from './gtfs-rt-interpreter-executor';
import { HttpExtractorExecutor } from './http-extractor-executor';
import { LocalFileExtractorExecutor } from './local-file-extractor-executor';
import { TextFileInterpreterExecutor } from './text-file-interpreter-executor';
import { TextLineDeleterExecutor } from './text-line-deleter-executor';
import { TextRangeSelectorExecutor } from './text-range-selector-executor';

export class StdExecExtension extends JayveeExecExtension {
  private readonly wrappedExtensions: JayveeExecExtension[] = [
    new TabularExecExtension(),
    new RdbmsExecExtension(),
  ];

  getBlockExecutors(): BlockExecutorClass[] {
    return [
      ...this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat(),
      HttpExtractorExecutor,
      TextFileInterpreterExecutor,
      TextRangeSelectorExecutor,
      TextLineDeleterExecutor,
      ArchiveInterpreterExecutor,
      FilePickerExecutor,
      GtfsRTInterpreterExecutor,
      LocalFileExtractorExecutor,
    ];
  }
}
