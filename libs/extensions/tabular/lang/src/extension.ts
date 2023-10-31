// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '@jvalue/jayvee-language-server';

import { CellRangeSelectorMetaInformation } from './lib/cell-range-selector-meta-inf';
import { CellWriterMetaInformation } from './lib/cell-writer-meta-inf';
import { ColumnDeleterMetaInformation } from './lib/column-deleter-meta-inf';
import { CSVInterpreterMetaInformation } from './lib/csv-interpreter-meta-inf';
import { RowDeleterMetaInformation } from './lib/row-deleter-meta-inf';
import { SheetPickerMetaInformation } from './lib/sheet-picker-meta-inf';
import { TableInterpreterMetaInformation } from './lib/table-interpreter-meta-inf';
import { TableTransformerMetaInformation } from './lib/table-transformer-meta-inf';
import { XLSXInterpreterMetaInformation } from './lib/xlsx-interpreter-meta-inf';

export class TabularLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [
      ColumnDeleterMetaInformation,
      RowDeleterMetaInformation,
      CellRangeSelectorMetaInformation,
      CellWriterMetaInformation,
      TableInterpreterMetaInformation,
      CSVInterpreterMetaInformation,
      TableTransformerMetaInformation,
      XLSXInterpreterMetaInformation,
      SheetPickerMetaInformation,
    ];
  }
}
